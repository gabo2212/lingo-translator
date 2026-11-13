# Implementation plan

This is the plan that the code in this repo follows. It is inference with a pretrained decoder-only Transformer. Nothing here trains or updates weights.

## Runtime

- Project venv: `.venv`, created with Python 3.12.10.
- PyTorch: `torch==2.15.0+cu134` from `https://download.pytorch.org/whl/cu134`.
  That index is the CUDA 13.4 wheel line. This PC's driver reports CUDA UMD 13.4 and the RTX 5080 is compute capability 12.0. The installed wheel's `get_arch_list()` includes `sm_120`. A BF16 matmul on the GPU already succeeded. The system Python 3.13 package `torch 2.13.0+cpu` is not used.
- Model: `Qwen/Qwen3-4B-Instruct-2507`, BF16, loaded once onto `cuda:0` with `device_map` pinned to that GPU. `model.eval()` and `torch.inference_mode()` around `generate`. If CUDA is missing, `/api/health` reports `error` and the process does not switch to CPU or to any hosted API.
- Cache: the default Hugging Face directory under the user profile (`HF_HOME`, default `%USERPROFILE%\.cache\huggingface`), which is outside this OneDrive folder. Weights are gitignored.
- Sampling start point: temperature 0.7, top_p 0.8, top_k 20, `do_sample` true, `min_p` 0 when the installed `generate` accepts it. `max_new_tokens` 180, caller cap 250. A dev comparison also runs temperature 0.9 and 1.1 on variant D. The yaml default is changed only if those real outputs are more metaphorical without dropping numbers. The comparison is written up from the saved text, not from invented scores.

## Layout

- `backend/app/styles.yaml` — voices, original few-shot demonstrations, sampling, and the second-pass flag (default off).
- `backend/app/prompts.py` — builds a system turn and a user turn. Variants A–D exist for the dev comparison. The HTTP API always uses the production variant.
- `backend/app/inference.py` — load once, tokenize, generate, decode new tokens only.
- `backend/app/main.py` — `GET /api/health`, `GET /api/styles`, `POST /api/translate`. CORS allows `http://localhost:5173` and `http://127.0.0.1:5173`.
- `backend/app/cleaning.py`, `metrics.py`, `single_flight.py` — decode cleanup, digit retention, and the one-at-a-time GPU lock (overlap returns HTTP 429). Generation timeout is 120 seconds (HTTP 504).
- `scripts/start.ps1` — uvicorn on `127.0.0.1:8000`. `scripts/start.sh` is the Arch-shaped equivalent and is labeled untested.
- `scripts/smoke_cuda.py` — CUDA facts plus one real generation.
- `scripts/run_benchmarks.py` — `--phase dev` then, after the prompt is frozen, `--phase final`.
- `benchmarks/dev_sentences.json` — 8 sentences, including the bathroom reference.
- `benchmarks/test_sentences.json` — 32 held-out sentences. The bathroom sentence is absent.
- `school/` — French talk outline, synthesis, interview answers, and the live demo script. Written after the measurements exist.
- `frontend/` — not created here.

## Prompt variants (LinkedIn motivational only)

Same model, same seed (13), same top_p 0.8, same top_k 20, temperature 0.7, on the 8 dev sentences.

| Variant | Instruction |
| --- | --- |
| A | Basic professional paraphrase |
| B | Original wording of the literal-double-meaning behavior, no demonstrations |
| C | Semantic-metaphor rules and the failure warning, no demonstrations |
| D | C plus 2–3 original demonstrations |

D is the production LinkedIn prompt unless the saved outputs show that C is clearly better. Demonstrations are original and are disjoint from the dev and test sentences. The bathroom sentence is never one of them.

Temperature 0.9 and 1.1 are run on variant D for the first four dev sentences only. Human rubric fields (`meaning`, `style_fidelity`, `metaphorical_humor`) are stored as null. Automated numbers are latency, peak GPU memory, and digit retention.

## API rules that the UI can rely on

- `text` is required, 1 to 4000 characters after trim. Empty or whitespace is HTTP 422.
- Unknown `style`, or an unknown `linkedin_tone` when style is `linkedin`, is HTTP 422.
- Omitted `linkedin_tone` on LinkedIn becomes `motivational`. On any other style the tone is ignored and the response sends null.
- A second request while `generate` is running is HTTP 429.
- The model is not ready: HTTP 503, and `/api/health` shows `loading` or `error`.

## What is deliberately not in the plan

No training loop, no 4-bit quantization, no CPU demo path, no Gemini/OpenAI/Groq/Claude/Hugging Face Inference call, no copy of the reference frontend, and no vendor of the weight files.
