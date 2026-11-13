# Start the local API on 127.0.0.1:8000.
# The frontend, if another person has created frontend/, is a separate process:
#   cd frontend
#   npm run dev
# That dev server is http://127.0.0.1:5173. The API reflects the browser Origin and allows this dev server.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
if (-not $env:HF_HOME) {
    $env:HF_HOME = Join-Path $env:USERPROFILE ".cache\huggingface"
}
$env:HF_HUB_DISABLE_TELEMETRY = "1"
$env:PYTHONIOENCODING = "utf-8"
$Python = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    throw "Missing $Python. Create the venv with Python 3.12 and install requirements.txt first."
}
$FrontendPackage = Join-Path $Root "frontend\package.json"
if (Test-Path $FrontendPackage) {
    $FrontendDir = Join-Path $Root "frontend"
    Start-Process -FilePath "powershell" -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-Command",
        "Set-Location -LiteralPath '$FrontendDir'; npm run dev"
    )
    Write-Host "Opened a second window for the frontend (npm run dev on port 5173)."
}
& $Python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
