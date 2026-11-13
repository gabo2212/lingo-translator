# Qwen3-4B-Instruct-2507 and this machine

Inspection date: 2026-11-13, about 13:52 local time (UTC−5). Read-only. No CUDA toolkit, driver, kernel, bootloader, or system config was changed. No model weights were downloaded. No packages were installed.

Model page fetched: https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507

Also fetched from that repo: `README.md`, `config.json`, `generation_config.json`, `tokenizer_config.json`. The card links the Qwen blog (https://qwenlm.github.io/blog/qwen3/), the Qwen3 GitHub repo (https://github.com/QwenLM/Qwen3), and the docs (https://qwen.readthedocs.io/en/latest/). Sampling numbers below are taken from this checkpoint’s model card **Best Practices** and from the committed `generation_config.json`, which agree. The hybrid checkpoint `Qwen/Qwen3-4B` (a different repo) was checked only to document how thinking mode is disabled there.

## Host versus the claimed demo laptop

This Cursor session is on a Windows desktop. It is not the claimed demo laptop.

| Claimed demo laptop | What this session actually is |
| --- | --- |
| Arch Linux, pacman, bash | Windows 11 Pro. PowerShell is the session shell. `bash.exe` exists only as the WSL launcher. Default WSL distro is Kali, not Arch. `pacman` was not found. No Arch commands were run. |
| ASUS ROG Zephyrus G14 | ASUS desktop board `ROG STRIX X670E-E GAMING WIFI`. SMBIOS model string is the generic `System Product Name`. Computer name `GABOPC`. |
| NVIDIA RTX 4080 Laptop GPU | NVIDIA GeForce RTX 5080, measured by `nvidia-smi` |
| ~24 GB system RAM | 33,435,672,576 bytes of physical RAM (31.14 GiB visible) |

Typical published VRAM for a GeForce RTX 4080 Laptop GPU is **12 GB**. That figure is a published spec, not a measurement on this machine. `nvidia-smi` here did not see a 4080.

Re-run `nvidia-smi` on the Zephyrus when that machine is the host. Do not copy this desktop’s 16303 MiB figure onto the laptop, and do not treat system RAM as VRAM on either machine.

## Hardware measured on this machine

### Operating system and memory

`Get-CimInstance Win32_ComputerSystem` / `Win32_OperatingSystem` / `Win32_Processor` / `Win32_BaseBoard`:

- OS: Microsoft Windows 11 Pro, version 10.0.26200, build 26200, 64-bit
- Last boot: 2026-11-13 1:30:07 PM
- Manufacturer: ASUS. Model: `System Product Name`. Name: `GABOPC`. System type: x64-based PC
- Board: ASUSTeK COMPUTER INC., `ROG STRIX X670E-E GAMING WIFI`, Rev 1.xx
- CPU: AMD Ryzen 9 7900X3D, 12 cores, 24 logical processors, max clock 4401 MHz
- `TotalPhysicalMemory`: 33,435,672,576 bytes (31.14 GiB)
- `TotalVisibleMemorySize`: 32,652,024 KB
- `FreePhysicalMemory` at inspection: 13,661,868 KB (about 13.0 GiB free)

That is system RAM. It is separate from GPU memory.

### GPU

`nvidia-smi` is present at `C:\WINDOWS\system32\nvidia-smi.exe`. Query at 13:52:20 on 2026-11-13:

```
NVIDIA-SMI 617.42    KMD Version: 617.42    CUDA UMD Version: 13.4
GPU 0  NVIDIA GeForce RTX 5080    WDDM    Bus-Id 00000000:01:00.0    Disp.A On
39%  40C  P0  51W / 360W
Memory-Usage  2465MiB / 16303MiB    GPU-Util 8%

name, memory.total [MiB], memory.free [MiB], memory.used [MiB], driver_version, compute_cap
NVIDIA GeForce RTX 5080, 16303 MiB, 13513 MiB, 2465 MiB, 617.42, 12.0
```

Measured VRAM is **16303 MiB** (about 15.9 GiB; the card is sold as 16 GB). At that instant about 13513 MiB was free and 2465 MiB was already in use by the Windows desktop session (WDDM). Compute capability is **12.0** (Blackwell, sm_120). The display is attached to this GPU.

`Get-CimInstance Win32_VideoController` also listed:

- `NVIDIA GeForce RTX 5080`, driver 32.0.16.1742, dated 2026-09-29, status OK, 1920×1080. WMI `AdapterRAM` was 4,293,918,720 bytes (about 4.00 GiB). That WMI field is the wrong number on this machine. Use `nvidia-smi` `memory.total`.
- `AMD Radeon(TM) Graphics`, PCI `VEN_1002&DEV_164E` (the CPU’s integrated GPU), WMI `AdapterRAM` 536,870,912 bytes. This is not the CUDA device.

### Disk

Workspace `C:\Users\tdgf\OneDrive\Bureau\CODE\transformer` is on `C:`.

`Win32_LogicalDisk` for `C:`: NTFS, size 1861.94 GB, free **327.21 GB**. An 8 GB weight download fits on this volume. Keep the Hugging Face cache out of the OneDrive project directory so the weights are not synced as project files. The existing cache is already outside the repo: `%USERPROFILE%\.cache\huggingface\hub`. `HF_HOME`, `TRANSFORMERS_CACHE`, and `HUGGINGFACE_HUB_CACHE` were unset. The only Qwen entry in that cache is `models--Qwen--Qwen3-TTS-12Hz-1.7B-Base`. `Qwen/Qwen3-4B-Instruct-2507` is not cached.

### Python, bash, and installed ML packages

PowerShell session. No conda on `PATH`.

| Check | Result |
| --- | --- |
| `python --version` | Python 3.12.10 |
| `where.exe python` | `Python312\python.exe`, then `Python313`, then `Python314`, then the WindowsApps stub |
| `py -0p` | 3.14 is the `py` default (`Python314\python.exe`); 3.13 and 3.12 are also installed |
| Python 3.12 `pip show` | `torch`, `transformers`, `accelerate`, `bitsandbytes` not installed |
| Python 3.13 `pip show` | `torch` 2.13.0 is installed (required by `demucs` and `julius`). `transformers`, `accelerate`, `bitsandbytes` are not |
| Python 3.14 `pip show` | `torch`, `transformers`, `accelerate`, `bitsandbytes` not installed |
| Workspace venv | None. No `pyvenv.cfg`, `requirements.txt`, or `pyproject.toml` under the workspace |

Probe of the already-installed 3.13 package, without installing anything:

```
torch 2.13.0+cpu
cuda_build None
cuda_available False
arch_list []
device_count 0
```

`bash.exe` is `C:\WINDOWS\system32\bash.exe`, GNU bash 5.3.9, and it enters WSL. `uname` through that bash: `Linux 6.6.87.2-microsoft-standard-WSL2 x86_64`. `wsl.exe -l -v`:

```
NAME              STATE           VERSION
* kali-linux        Running         2
  docker-desktop    Stopped         2
```

`wsl.exe -d kali-linux -- exec cat /etc/os-release` reports `Kali GNU/Linux Rolling`, version 2026.2, `ID=kali`, `ID_LIKE=debian`. `pacman` is not on that PATH. WSL’s `nvidia-smi` shim exists at `/usr/lib/wsl/lib/nvidia-smi`. That WSL distro was not used for inference and is not the Arch demo environment.

### Can CUDA inference be verified here?

The driver can see the RTX 5080 and reports CUDA UMD 13.4. That is not a verified inference run.

CUDA inference of this model cannot be verified in this session:

- The only installed PyTorch is a CPU build (`2.13.0+cpu`), and `torch.cuda.is_available()` is false.
- `transformers` is not installed in any workspace venv or in the three system Pythons checked.
- The 4B Instruct weights are not in the local Hugging Face cache, and they were not downloaded.

A later check, after a CUDA wheel is installed into a project venv, is `torch.cuda.is_available()`, the device name, and `'sm_120' in torch.cuda.get_arch_list()`. Do not treat the system 3.13 CPU torch as the project environment.

## Model

`Qwen/Qwen3-4B-Instruct-2507` is an updated **non-thinking** Qwen3-4B instruct checkpoint. The card describes it as the updated Qwen3-4B non-thinking mode, with better instruction following, reasoning, long-tail multilingual knowledge, preference alignment, and 256K long-context use. Hugging Face lists the tensor type as **BF16**.

This is **pretrained inference**, not training from scratch. The card’s “Training Stage: Pretraining & Post-training” describes how Qwen produced the checkpoint. A demo loads those weights and calls `generate()`. It does not run a training loop, build the transformer from random initialization, or call Gemini, OpenAI, Groq, Claude, or any other hosted API.

### Architecture

Decoder-only causal Transformer.

| Item | Value | Source |
| --- | --- | --- |
| Architecture class | `Qwen3ForCausalLM` | `config.json` |
| `model_type` | `qwen3` | `config.json` |
| Type on the card | Causal language model | README |
| Parameters | 4.0B total, 3.6B non-embedding | README |
| Layers | 36 | README and `num_hidden_layers` |
| Attention | Grouped-query: 32 query heads, 8 KV heads, `head_dim` 128 | README and config |
| Hidden size | 2560 | config |
| MLP intermediate | 9728, SiLU | config |
| Norm | RMSNorm, `eps` 1e-6 | config |
| Position encoding | RoPE, `rope_theta` 5,000,000, `rope_scaling` null, sliding window off | config |
| Embeddings | `tie_word_embeddings` true. Vocab 151,936. Embedding matrix is about 151936 × 2560 ≈ 0.39B parameters, which accounts for 4.0B − 3.6B | config |
| Context length | **262,144 tokens native** (`max_position_embeddings`) | README and config |
| Checkpoint dtype | `torch_dtype: bfloat16` | config |
| `transformers` version stamped in the files | 4.51.0 | config and generation config |
| BOS / EOS ids | 151643 (`<\|endoftext\|>`) / 151645 (`<\|im_end\|>`). Generation config also allows 151643 as EOS. Pad is 151643 | config, generation config, tokenizer |

`transformers` older than 4.51.0 fails to recognize the architecture:

```
KeyError: 'qwen3'
```

### License

The model card front matter says `license: apache-2.0`, with `license_link` pointing at https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507/blob/main/LICENSE. Hugging Face displays “License: apache-2.0”. The weights are published under Apache 2.0.

### Instruct template and thinking mode

This checkpoint is instruct/chat, not a base completion model. The tokenizer class is `Qwen2Tokenizer`. The chat template is ChatML:

- A system message, when present, is wrapped as `<|im_start|>system\n...<|im_end|>\n`.
- User and assistant turns use `<|im_start|>{role}\n...<|im_end|>\n`.
- Tool definitions and tool calls have their own blocks (`<tools>`, `<tool_call>`, `<tool_response>`).
- `add_generation_prompt=True` appends `<|im_start|>assistant\n` so generation starts on the assistant turn.
- EOS is `<|im_end|>`.

The published template for **this** repo does **not** contain an `enable_thinking` branch. The model card states, verbatim in substance: this model supports only non-thinking mode and does not generate `<think></think>` blocks. Specifying `enable_thinking=False` is no longer required.

The vocabulary still defines `<think>` (id 151667) and `</think>` (id 151668) as ordinary added tokens (`special: false`). They are leftover tokens, not a mode switch for this checkpoint.

The older hybrid repo `Qwen/Qwen3-4B` is different. Its card still documents a hard switch:

- Thinking mode (`enable_thinking=True`, the hybrid default): the model writes a `<think>...</think>` block before the answer. Recommended sampling there is temperature **0.6**, top_p **0.95**, top_k **20**, min_p **0**. The hybrid card says not to use greedy decoding in thinking mode, because it can degrade quality and repeat forever.
- Non-thinking mode on that hybrid checkpoint: pass `enable_thinking=False` into `apply_chat_template`. Recommended sampling is temperature **0.7**, top_p **0.8**, top_k **20**, min_p **0**.

Load `Qwen/Qwen3-4B-Instruct-2507` for the demo. Do not load `Qwen/Qwen3-4B` or `Qwen/Qwen3-4B-Thinking-2507` and then try to strip think tags after the fact.

### Verified sampling defaults

The user’s claimed defaults match the current instruct checkpoint.

Model card Best Practices:

- Temperature **0.7**, TopP **0.8**, TopK **20**, MinP **0**
- `presence_penalty` between 0 and 2 can reduce endless repetition. Higher values can mix languages and can slightly hurt quality.
- The card recommends an output length of **16,384** tokens for most queries. That is the quality suggestion for open-ended use, not a minimum and not the right cap for a short demo.

Committed `generation_config.json`:

```json
{
    "bos_token_id": 151643,
    "do_sample": true,
    "eos_token_id": [151645, 151643],
    "pad_token_id": 151643,
    "temperature": 0.7,
    "top_k": 20,
    "top_p": 0.8,
    "transformers_version": "4.51.0"
}
```

`do_sample` is true. There is no `min_p` key in the file; MinP=0 in the prose means “do not apply a min-p cutoff.” Pass temperature, top_p, and top_k explicitly in the demo so a future library default cannot silently replace them.

### Official loading pattern

Not executed. The model card quickstart is:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "Qwen/Qwen3-4B-Instruct-2507"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype="auto",   # resolves to bfloat16 from config.json
    device_map="auto",
)

messages = [{"role": "user", "content": prompt}]
text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True,
)
model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

generated_ids = model.generate(
    **model_inputs,
    max_new_tokens=16384,  # card example; the demo should use 100–250
)
new_tokens = generated_ids[0][len(model_inputs.input_ids[0]):]
content = tokenizer.decode(new_tokens, skip_special_tokens=True)
```

The Hugging Face “use this model” snippet is the same idea with `apply_chat_template(..., tokenize=True, return_dict=True, return_tensors="pt")` and `max_new_tokens=256`. `torch_dtype="auto"` plus `device_map="auto"` is the pattern to follow. The card also says `transformers` should be current, and at least 4.51.0.

For a long-context server the card shows `sglang>=0.4.6.post1` or `vllm>=0.8.5` with context length 262144, and says to drop the context toward 32,768 if that OOMs. A short local demo does not need either server.

### Dtype and VRAM

Published dtype is **bfloat16**. FP16 is the same weight size (2 bytes per parameter) and is the fallback only if a GPU cannot run BF16. This RTX 5080 (sm_120) and a typical RTX 4080 Laptop (Ada, sm_89) both have BF16 hardware. Prefer BF16.

These sizes are arithmetic, not a measurement from loading the checkpoint:

| Format | Weight memory | Notes |
| --- | --- | --- |
| BF16 or FP16 | 4.0B × 2 bytes ≈ **8 GB** | Tied embeddings, so there is no second 0.39B output matrix |
| 4-bit (NF4-style) | 4.0B × 0.5 byte ≈ **2 GB**, plus scale metadata, roughly 2.5–3.5 GB | Use only when free VRAM cannot hold the BF16 weights |

KV cache in BF16 with this GQA shape: 2 (K and V) × 8 KV heads × 128 × 36 layers × 2 bytes = **144 KiB per token**.

| Context | KV cache, BF16 |
| --- | --- |
| 250 new tokens | about 36 MB |
| 8K tokens | about 1.1 GB |
| 32K tokens | about 4.5 GB |
| 262,144 tokens (native max) | about 36 GB, which fits neither 16 GB nor 12 GB |

A short prompt plus a short answer needs about **9–11 GB** for BF16 weights, allocator overhead, and a small cache. The native 256K context does not fit. The card’s own OOM note is to shorten the context; do that before quantizing.

On this machine, 16303 MiB total and 13513 MiB free at inspection, so BF16 with a short context fits in the free VRAM that was observed, with headroom left. **4-bit is not indicated here.**

On a 12 GB RTX 4080 Laptop (published spec, not measured), the same short-context BF16 budget still fits if the desktop is not already holding several gigabytes of VRAM. If it is, shorten the context first. Move to 4-bit only when free VRAM cannot keep the ~8 GB BF16 weights plus headroom.

### Known pitfalls

- **Wrong checkpoint.** `Qwen/Qwen3-4B` still thinks by default and will spend the token budget inside `<think>`. This Instruct-2507 card says thinking is already off and `enable_thinking=False` is not required. The template in this repo has no such flag. Passing a flag the template does not read does nothing useful; loading the hybrid repo by mistake does.
- **Think tokens still exist** in the tokenizer (151667, 151668) as normal tokens. Do not write a parser that waits for `</think>` on this checkpoint. The answer is the assistant text, ended by `<|im_end|>`.
- **Greedy decoding and repetition.** `generation_config.json` sets `do_sample: true`. The hybrid thinking card warns that greedy decoding causes repetition and worse answers. Keep sampling on. If a short demo still loops, a small `presence_penalty` (the card allows 0 to 2) is the documented control. A high penalty can mix languages.
- **Sampling mix-up.** Thinking-mode numbers (0.6 / 0.95 / 20) belong to the hybrid thinking switch, not to this instruct checkpoint. This checkpoint is 0.7 / 0.8 / 20.
- **Output length.** The card’s 16,384-token suggestion will make a demo slow and will grow the KV cache. Cap the demo at about **100–250 new tokens**, and ask for a short answer in the prompt. 16,384 remains the card’s advice for long answers, not the demo cap.
- **Full context OOM.** `max_position_embeddings` of 262144 is not a license to allocate that cache. A 16 GB or 12 GB GPU needs a much smaller runtime context. Short demo prompts make this a non-issue.
- **Old transformers.** Below 4.51.0: `KeyError: 'qwen3'`.
- **CPU torch on this PC.** Python 3.13 already has `torch 2.13.0+cpu`. Installing the project into that interpreter, or letting pip pull a CPU wheel, will report `cuda_available False` even though `nvidia-smi` works.
- **Blackwell wheel mismatch.** Compute capability 12.0 is missing from CUDA 12.6 PyTorch wheels. A cu126 install can load and then fail at runtime with no kernel image for the device. CUDA 13.0 and 13.2 wheels are the builds documented in 2026 as including sm_120. An RTX 4080 Laptop (sm_89) is covered by those same CUDA 13 wheels through the 8.6 architecture list. One CUDA 13 index can serve both machines. Recheck https://pytorch.org/get-started/locally/ at install time, because the default PyPI CUDA version has moved (12.8 removed, 13.0 then 13.2).
- **WMI VRAM.** `Win32_VideoController.AdapterRAM` reported about 4 GB for the RTX 5080. `nvidia-smi` memory.total is 16303 MiB. Do not size the loader from WMI, and do not size it from system RAM.
- **OneDrive.** The repo lives under `OneDrive\Bureau\CODE\transformer`. Do not download weights into the repo.

## How the project should be laid out

Develop on this Windows host. Run the same venv recipe later on Arch. Do not depend on pacman for PyTorch, and do not depend on the system 3.13 CPU torch.

Suggested layout (not created by this note):

```
transformer/
  .venv/                         # per machine, gitignored
  requirements.txt               # transformers>=4.51.0, accelerate, and the app stack
  src/...                        # one process-wide loader
```

Windows, when someone chooses to install (this inspection did not):

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cu130
python -m pip install -r requirements.txt
python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available(), torch.cuda.get_device_name(0), torch.cuda.get_arch_list())"
```

Use `cu132` instead of `cu130` if that is what https://pytorch.org/get-started/locally/ lists for the installed driver. The driver here reports CUDA UMD 13.4, so a CUDA 13 wheel is in range. Confirm `sm_120` is in `get_arch_list()` before loading the model. The torch wheel plus CUDA libraries is a multi-gigabyte download; do it in the venv, not into Python 3.13’s site-packages.

Arch later, on the Zephyrus, after `nvidia-smi` has been read on that machine:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cu130
python -m pip install -r requirements.txt
```

`pacman -S python-pytorch` is a different build and may be CPU or the wrong CUDA. Prefer the venv and the same CUDA 13 index, then confirm the laptop GPU name and `memory.total` with `nvidia-smi`. Pin the versions that actually install (`torch==…`, `transformers==…`) in `requirements.txt` once that install has been verified. `transformers` must be `>=4.51.0`.

Set the Hugging Face cache to a local directory that is not inside OneDrive, for example `HF_HOME` on a non-synced path. C: has about 327 GB free, so the ~8 GB BF16 snapshot fits.

### Loading strategy

- Load `Qwen/Qwen3-4B-Instruct-2507` once per process and keep that object resident between requests. Reloading per request spends seconds and allocator churn for no benefit.
- Prefer **BF16** (`torch_dtype="auto"` or `torch.bfloat16`) on `cuda`. On this 16303 MiB GPU that is the right choice for short prompts. FP16 only if BF16 is unavailable. 4-bit (`bitsandbytes` NF4) only if free VRAM cannot hold the ~8 GB weights plus headroom. That is not the case on the measured desktop. On a 12 GB laptop it is a fallback, not the default.
- `device_map="auto"` or an explicit `.to("cuda")` after checking `torch.cuda.is_available()`. A CPU path can exist for plumbing tests. The demo path is the GPU.
- Chat formatting goes through `apply_chat_template(..., add_generation_prompt=True)`. Do not hand-roll ChatML.
- Sampling: `do_sample=True`, `temperature=0.7`, `top_p=0.8`, `top_k=20`. Add `presence_penalty` only if repetition shows up.
- `max_new_tokens` about **100–250** for the demo. Leave the card’s 16384 figure unused unless a long-answer mode is an explicit feature.
- No cloud APIs.

## Sources

- https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507 (card, README, `config.json`, `generation_config.json`, `tokenizer_config.json`), fetched 2026-11-13
- https://huggingface.co/Qwen/Qwen3-4B (hybrid thinking switch and the 0.6 / 0.95 thinking sampler; not the demo checkpoint)
- https://qwen.readthedocs.io/en/latest/ and https://qwenlm.github.io/blog/qwen3/ (linked from the model card)
- https://pytorch.org/get-started/locally/ (recheck the CUDA index at install time). 2026 packaging notes: CUDA 13.x wheels include Blackwell sm_120; CUDA 12.6 wheels do not.
