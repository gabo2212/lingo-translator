"""Load Qwen once on CUDA and sample a rewrite. This file does not train anything."""

from __future__ import annotations

import inspect
import logging
import threading
import time
from dataclasses import dataclass

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, set_seed

from backend.app.cleaning import clean_generation, decode_new_tokens
from backend.app.errors import GenerationFailedError, ModelNotReadyError
from backend.app.passes import run_passes
from backend.app.prompts import build_prompt, load_catalog, second_pass_messages
from backend.app.schemas import TranslateJob
from backend.app.single_flight import SingleFlight
from backend.app.validation import Sampling, resolve_sampling

log = logging.getLogger(__name__)

MODEL_ID = "huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated"


@dataclass
class GenerateResult:
    translation: str
    style: str
    linkedin_tone: str | None
    model: str
    device: str
    elapsed_ms: int
    prompt_id: str


class InferenceService:
    """One resident model. Requests never call load() again after the first success."""

    autoload = True

    def __init__(self) -> None:
        self.model_id = MODEL_ID
        self.status = "loading"
        self.detail: str | None = "Loading the model onto CUDA."
        self.device = "cuda"
        self.gpu_name: str | None = None
        self.dtype = "bfloat16"
        self.load_count = 0
        self.model = None
        self.tokenizer = None
        self.timeout_seconds = 120.0
        self._flight = SingleFlight()
        self._load_lock = threading.Lock()
        try:
            self.timeout_seconds = load_catalog().sampling.timeout_seconds
        except Exception:
            log.warning("Could not read timeout from styles.yaml; using %s seconds", self.timeout_seconds)

    def health(self) -> dict[str, object]:
        return {
            "status": self.status,
            "model": self.model_id,
            "device": self.device,
            "gpu_name": self.gpu_name,
            "dtype": self.dtype,
            "detail": self.detail,
        }

    def load(self) -> None:
        """Load tokenizer and weights a single time. A second call returns the same objects."""
        with self._load_lock:
            if self.status == "ready" and self.model is not None and self.tokenizer is not None:
                return
            self.load_count += 1
            self.status = "loading"
            self.detail = "Loading tokenizer and weights onto CUDA."
            try:
                self._load_on_cuda()
            except Exception as exc:
                self.status = "error"
                self.device = "unavailable"
                self.model = None
                self.tokenizer = None
                self.detail = str(exc)
                log.exception("CUDA model load failed")
                raise

    def translate(self, job: TranslateJob) -> GenerateResult:
        if self.status != "ready" or self.model is None or self.tokenizer is None:
            raise ModelNotReadyError(self.detail or "Model is not ready.")
        catalog = load_catalog()
        self.timeout_seconds = catalog.sampling.timeout_seconds
        sampling = resolve_sampling(
            temperature=job.temperature,
            max_new_tokens=job.max_new_tokens,
            seed=job.seed,
            defaults=catalog.sampling,
        )
        built = build_prompt(job.text, job.style, job.linkedin_tone, job.variant, catalog)
        # The lock is acquired only after validation, and released even if generate fails.
        self._flight.acquire()
        started = time.perf_counter()
        try:
            def draft() -> str:
                return self._generate_from_messages(built.messages, sampling)

            def rewrite(draft_text: str) -> str:
                messages = second_pass_messages(built.user, draft_text, catalog)
                return self._generate_from_messages(messages, sampling)

            text = run_passes(catalog.second_pass_enabled, draft, rewrite)
        except Exception as exc:
            raise GenerationFailedError(str(exc)) from exc
        finally:
            self._flight.release()
        prompt_id = built.prompt_id
        if catalog.second_pass_enabled:
            prompt_id = f"{prompt_id}+second"
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        log.info("generated style=%s prompt=%s elapsed_ms=%s", built.style, prompt_id, elapsed_ms)
        return GenerateResult(
            translation=text,
            style=built.style,
            linkedin_tone=built.linkedin_tone,
            model=self.model_id,
            device=self.device,
            elapsed_ms=elapsed_ms,
            prompt_id=prompt_id,
        )

    def _load_on_cuda(self) -> None:
        # The demo path is CUDA only. A CPU wheel or a missing kernel is an error, not a fallback.
        if not torch.cuda.is_available():
            cuda_build = getattr(torch.version, "cuda", None)
            raise RuntimeError(
                "CUDA is not available in this Python environment. "
                f"torch={torch.__version__} cuda_build={cuda_build}. "
                "This demo does not fall back to CPU and does not call a cloud model. "
                "Install a PyTorch build that includes compute capability 12.0 (sm_120)."
            )
        gpu_name = torch.cuda.get_device_name(0)
        major, minor = torch.cuda.get_device_capability(0)
        log.info("CUDA device %s capability %s.%s", gpu_name, major, minor)
        tokenizer = AutoTokenizer.from_pretrained(self.model_id)
        model = _from_pretrained_bf16(self.model_id)
        model.eval()
        parameter_device = next(model.parameters()).device
        if parameter_device.type != "cuda":
            raise RuntimeError(
                f"Model weights landed on {parameter_device}, not CUDA. "
                "Refusing to continue, because a silent CPU offload would not be the demo."
            )
        if tokenizer.pad_token_id is None:
            tokenizer.pad_token_id = tokenizer.eos_token_id
        self.tokenizer = tokenizer
        self.model = model
        self.device = "cuda"
        self.gpu_name = gpu_name
        self.dtype = "bfloat16"
        self.status = "ready"
        self.detail = None

    def _generate_from_messages(self, messages: tuple[dict[str, str], ...] | list, sampling: Sampling) -> str:
        """Run one forward generation. Numbered comments are the inference steps."""
        if self.model is None or self.tokenizer is None:
            raise ModelNotReadyError(self.detail or "Model is not ready.")
        if sampling.seed is not None:
            set_seed(sampling.seed)
        # 1. Render ChatML. The system turn carries the style. The user turn is the source text.
        prompt_text = self.tokenizer.apply_chat_template(
            list(messages),
            tokenize=False,
            add_generation_prompt=True,
        )
        # 2. Tokenize the rendered prompt and move those tensors to the GPU.
        model_inputs = self.tokenizer(prompt_text, return_tensors="pt")
        model_inputs = {name: tensor.to("cuda") for name, tensor in model_inputs.items()}
        prompt_length = int(model_inputs["input_ids"].shape[-1])
        generate_kwargs: dict[str, object] = {
            "do_sample": True,
            "temperature": sampling.temperature,
            "top_p": sampling.top_p,
            "top_k": sampling.top_k,
            "max_new_tokens": sampling.max_new_tokens,
        }
        # MinP 0 matches the Qwen card: no extra probability floor on top of top-p and top-k.
        if _generate_accepts_min_p(self.model):
            generate_kwargs["min_p"] = 0.0
        # 3. Sample new token ids. inference_mode keeps autograd off; the weights are not updated.
        with torch.inference_mode():
            generated = self.model.generate(**model_inputs, **generate_kwargs)
        # 4. Decode only the new tokens, then drop special-token debris and a leading label.
        raw = decode_new_tokens(self.tokenizer, generated[0], prompt_length)
        return clean_generation(raw)


def _generate_accepts_min_p(model: object) -> bool:
    try:
        parameters = inspect.signature(model.generate).parameters
    except (TypeError, ValueError):
        return False
    if "min_p" in parameters:
        return True
    return any(parameter.kind == inspect.Parameter.VAR_KEYWORD for parameter in parameters.values())


def _from_pretrained_bf16(model_id: str):
    """Place BF16 weights on CUDA. device_map is pinned to cuda:0 so nothing spills to CPU."""
    common = {
        "low_cpu_mem_usage": True,
        "device_map": {"": "cuda:0"},
    }
    try:
        return AutoModelForCausalLM.from_pretrained(model_id, dtype=torch.bfloat16, **common)
    except TypeError as exc:
        if "dtype" not in str(exc):
            raise
        return AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.bfloat16, **common)
