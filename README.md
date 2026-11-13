# Local lingo translator

A small school project: rewrite a sentence in another voice with a pretrained Transformer, running entirely on this machine. The weights are not trained here. Prompt text is configuration, not a training step.

Verified on this PC (13 November 2026):

- Windows 11 Pro, AMD Ryzen 9 7900X3D, 31.1 GiB system RAM
- NVIDIA GeForce RTX 5080, **16303 MiB VRAM** (`nvidia-smi`), driver 617.42, CUDA UMD 13.4, compute capability 12.0
- Project venv: Python 3.12.10, `torch 2.15.0+cu134`
- `torch.cuda.is_available()` was true, `get_arch_list()` included `sm_120`, and a BF16 matmul on the GPU returned `[[2.0, 2.0], [2.0, 2.0]]`

System RAM and VRAM are different numbers. Do not size the model from the 31 GiB of RAM, and do not trust `Win32_VideoController.AdapterRAM` (it reported about 4 GiB on this card). Use `nvidia-smi`.

The measured generation, latency, and digit-retention numbers are in `docs/evaluation_report.md`. They come from this Windows machine, not from an Arch laptop and not from an RTX 4080.

## 1. Dependencies

- Python 3.12 (3.13 only if a CUDA wheel exists for it; this repo was built with 3.12.10)
- An NVIDIA driver new enough for CUDA 13.4. This PC: driver 617.42
- Disk space for the wheel (about 2.2 GB) and the model (about 8 GB of BF16 weights), outside the git checkout
- The Python packages in `requirements.txt`

No CUDA toolkit install is required. The PyTorch wheel ships its own CUDA runtime. Do not change the NVIDIA driver from these instructions.

## 2. Installation

From the repo root in PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -U pip
.\.venv\Scripts\python.exe -m pip install torch==2.15.0+cu134 --index-url https://download.pytorch.org/whl/cu134
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available(), torch.cuda.get_device_name(0), torch.cuda.get_device_capability(0), torch.cuda.get_arch_list())"
```

`requirements.txt` repeats the torch pin and points at the same CUDA 13.4 index. If pip ever installs a `+cpu` build, uninstall torch and run the index command above again. `sm_120` must appear in `get_arch_list()` before you load the model. A CUDA 12.6 wheel does not contain Blackwell kernels.

The venv lives in `.venv` and is gitignored. Do not install these packages into the system Python. A Python 3.13 environment on this PC already has `torch 2.13.0+cpu`; that is the wrong runtime.

## 3. Model download

The first generation downloads `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated` from Hugging Face into the default cache. That checkpoint is an abliteration of `Qwen/Qwen3-4B-Instruct-2507`: a refusal direction is removed from the pretrained weights. It is not training from scratch, and it is not the student's weight training. The runtime id lives in `MODEL_ID` in `backend/app/inference.py`. See `docs/model_swap.md`.

`%USERPROFILE%\.cache\huggingface`

That directory is outside this OneDrive project folder. Do not copy the weights into the repo. The checkpoint is Apache 2.0, about 8 GB in BF16, and 4-bit is unnecessary on a 16 GB card for these short prompts.

```powershell
$env:HF_HOME = Join-Path $env:USERPROFILE ".cache\huggingface"
.\.venv\Scripts\python.exe scripts\smoke_cuda.py
```

`scripts/smoke_cuda.py` prints the CUDA facts and one real `generate()` from that model.

## 4. Start

API only (this is what `scripts/start.ps1` does):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

The server is `http://127.0.0.1:8000`. If `frontend/package.json` is present, the script also opens a second PowerShell window that runs `npm run dev` there. Vite in this repo is set to port 5173. The API window stays in the foreground. This backend did not create `frontend/`.

- `GET /api/health`
- `GET /api/styles`
- `POST /api/translate` with JSON `{"text": "...", "style": "linkedin", "linkedin_tone": "motivational"}`

Do not pass `--reload` to uvicorn. A reload would load the weights a second time.

The web UI is a separate app under `frontend/`. Vite in this repo listens on `127.0.0.1:5173` and proxies `/api` to `127.0.0.1:8000`. The API reflects the browser `Origin` and does not use cookies.

## Class

The slides and the translator can be hosted as a static site. The model stays on the laptop that has the GPU. Open `/slides` for the oral with no GPU. The translator calls the laptop only when that API answers a health check. If the laptop is offline, the page says so and does not invent a translation.

On the teacher PC:

- Open the Vercel URL once `connect.json` on the default branch names the laptop tunnel. The host steps are in `docs/HOST_AGENT.md`.
- Or clone this repo and run `npm install` once, then `npm run dev`, inside `frontend/`. That dev server proxies `/api` to `127.0.0.1:8000`. On an `http://` page it also tries `http://lingo.local:8000` when the laptop publishes that name.

`scripts/start.ps1` and `scripts/start.sh` stay on `127.0.0.1`. `scripts/host.sh` is the classroom bind (`0.0.0.0:8000`). It does not start the tunnel. A quick Cloudflare tunnel is public until `cloudflared` is stopped, and the URL changes every launch.

Vercel project root: `frontend/`. Build: `npm run build`. Output: `dist`. Do not deploy the Python API to Vercel and do not set `VITE_API_BASE`. If the CLI is not logged in:

```bash
cd frontend
npx vercel login
npx vercel link
npx vercel --prod --yes
```

If the project was linked at the repo root, set Root Directory to `frontend` in the Vercel project settings, then redeploy.

## 5. Benchmarks

Dev sentences (including the bathroom reference) and 32 held-out test sentences:

```powershell
.\.venv\Scripts\python.exe scripts\run_benchmarks.py --phase dev
.\.venv\Scripts\python.exe scripts\run_benchmarks.py --phase final
```

`--phase dev` compares prompt variants A–D at temperature 0.7, seed 13, LinkedIn motivational, then temperatures 0.9 and 1.1 on variant D for four sentences. `--phase final` runs the yaml default on the other styles and on the test split. Raw text, latency, peak GPU memory, and digit retention are written to `benchmarks/results/`. The 1–5 human scores in those files are null. They are not filled in by the script.

## 6. Tests

Unit tests mock the generator. They do not need the GPU:

```powershell
.\.venv\Scripts\python.exe -m pytest -m "not gpu" -q
```

One real GPU test loads the model, generates text, and checks that a second call does not load the weights again:

```powershell
.\.venv\Scripts\python.exe -m pytest -m gpu -q -s
```

## 7. GPU troubleshooting

| Symptom | What it means here |
| --- | --- |
| `torch.cuda.is_available()` is false | The venv has a CPU wheel, or the driver is not visible. Check `torch.__version__` for `+cu134`, not `+cpu`. |
| `no kernel image is available` | The wheel was built without `sm_120`. Use the CUDA 13.4 index above, not cu126. |
| CUDA out of memory | Something else is holding VRAM. `nvidia-smi` shows the real free VRAM. Close it, or shorten `max_new_tokens`. Do not switch the demo to CPU, and do not quantize unless free VRAM cannot hold the ~8 GB BF16 weights. |
| Health status `error` | Read the `detail` field. The API does not hide a CUDA failure by answering on CPU. |
| Very slow first start | The weights are downloading, or Windows is paging them in. Later starts read the cache. |

`/api/health` returns `loading`, `ready`, or `error`, plus `model`, `device`, `gpu_name`, `dtype`, and `detail`.

## 8. Offline demo after the cache exists

Once `scripts/smoke_cuda.py` has completed once, later runs do not need the network:

```powershell
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

If the cache is missing, offline mode fails immediately. That is better than a silent cloud call. This project never calls Gemini, OpenAI, Groq, Claude, or the Hugging Face Inference API.

## Arch Linux (not run on this PC)

`scripts/start.sh` was written here and **was not executed** on Arch. There is no Arch machine in this session. A future Arch install should not use `pacman -S python-pytorch` for this app; that package is a different build. Sketch, untested:

```bash
sudo pacman -S --needed python python-pip
python -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
python -m pip install torch==2.15.0+cu134 --index-url https://download.pytorch.org/whl/cu134
python -m pip install -r requirements.txt
python -c "import torch; print(torch.__version__, torch.cuda.get_device_name(0), torch.cuda.get_arch_list())"
bash scripts/start.sh
```

Read `nvidia-smi` on that machine and record its own GPU name and `memory.total`. Do not copy this desktop's 16303 MiB figure onto a laptop, and do not treat system RAM as VRAM.

## Styles

`backend/app/styles.yaml` is the editable catalog. LinkedIn tones are `motivational`, `humble_brag`, `thought_leader`, `inspirational`, and `corporate`. Other styles: `chatgpt`, `corporate`, `hr`, `brainrot`, `tech_bro`, `ceo`, `academic`. Changing the yaml does not reload the weights. The second-pass rewrite flag defaults to off.

Sampling defaults follow the abliterated checkpoint's `generation_config.json`, which matches the Qwen3-4B-Instruct-2507 card (temperature 0.7, top_p 0.8, top_k 20). A dev comparison of 0.7, 0.9, and 1.1 kept 0.7: 1.1 invented a clock time on the reference sentence, and the higher temperatures did not fix the weak metaphors. Details and the raw text are in `docs/evaluation_report.md`.
