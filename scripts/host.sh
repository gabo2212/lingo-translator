#!/usr/bin/env bash
# Written on Windows. This file was not executed on Arch in the session that added it.
# It starts the API on 0.0.0.0:8000. It does not start cloudflared and it does not write connect.json.
# Do not install PyTorch with `pacman -S python-pytorch`. Do not change the NVIDIA driver.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export HF_HOME="${HF_HOME:-$HOME/.cache/huggingface}"
export HF_HUB_DISABLE_TELEMETRY=1
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export PYTHONIOENCODING=utf-8
PYTHON="$ROOT/.venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  echo "Missing $PYTHON. Create the venv on the Arch machine. See docs/HOST_AGENT.md." >&2
  exit 1
fi
echo "API will listen on 0.0.0.0:8000 so the classroom LAN can reach it."
echo "This script does not open the tunnel and does not update connect.json."
echo "In another terminal, run: cloudflared tunnel --url http://127.0.0.1:8000"
echo "Read the https://*.trycloudflare.com URL, write it to repo-root connect.json, commit only that file, and push."
echo "HF_HUB_OFFLINE and TRANSFORMERS_OFFLINE are set. If the weights are not cached yet, stop and download them once before using this script."
exec "$PYTHON" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
