#!/usr/bin/env bash
# UNTESTED on Arch Linux.
# This file was written on Windows 11 and was not executed under pacman or bash.
# Do not install PyTorch with `pacman -S python-pytorch` for this project.
# That package is a different build and may be CPU-only or the wrong CUDA.
# Use a venv and the same CUDA wheel index documented in the README.
#
# System packages a future Arch machine may need before creating the venv
# (not run here):
#   sudo pacman -S --needed python python-pip
#
# Classroom LAN and the tunnel use scripts/host.sh, which binds 0.0.0.0.
# This file stays on 127.0.0.1 for a local demo.
#
# Frontend, if frontend/ exists, is separate:
#   cd frontend && npm run dev
# That serves http://localhost:5173.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export HF_HOME="${HF_HOME:-$HOME/.cache/huggingface}"
export HF_HUB_DISABLE_TELEMETRY=1
export PYTHONIOENCODING=utf-8
PYTHON="$ROOT/.venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  echo "Missing $PYTHON. See README section 2. Do not use the system PyTorch package." >&2
  exit 1
fi
if [[ -f "$ROOT/frontend/package.json" ]]; then
  echo "frontend/ is present. This script only starts the API. In another terminal: cd frontend && npm run dev"
  echo "That note was not executed on Arch."
fi
exec "$PYTHON" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
