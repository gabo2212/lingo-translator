# Host agent on the Arch laptop

You are the agent on the student's Arch laptop. The Windows checkout that wrote this file cannot start the tunnel, cannot see the laptop GPU, and did not run these commands. You are the host. Do not change the NVIDIA driver. Do not change the model id in `backend/app/inference.py`. Do not change LinkedIn prompts, sampling, or style text.

The model id already in code is `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`.

## 1. What you are hosting

- The React app is static. Vercel can serve it, including `/slides`, with no GPU.
- The FastAPI process stays on this laptop. It is not a Vercel function.
- Browsers on `https://` never call `http://` (mixed content). A private LAN address from the Vercel page will fail. The public `https://*.trycloudflare.com` URL in repo-root `connect.json` is how the Vercel page reaches this laptop.
- An empty `apiBase` means offline. The page must say the laptop is unreachable. It must not invent a translation.

## 2. Install cloudflared if it is missing

Do not touch the NVIDIA driver while doing this.

```bash
sudo pacman -S --needed cloudflared
cloudflared --version
```

If pacman reports that the package does not exist, install the official amd64 binary and nothing else:

```bash
curl -fsSL -o /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo install -m 755 /tmp/cloudflared /usr/local/bin/cloudflared
cloudflared --version
```

## 3. Python environment

Use the project venv. Do not install PyTorch with `pacman -S python-pytorch`.

If `.venv/bin/python` is missing, create it the way `README.md` describes for Arch (venv plus the CUDA wheel index). Confirm `nvidia-smi` on this laptop and record this machine's own GPU name. Do not copy the Windows desktop's 16303 MiB figure.

Cache the weights once, online, before the offline host script:

```bash
cd /ABSOLUTE/PATH/TO/REPO
export HF_HOME="${HF_HOME:-$HOME/.cache/huggingface}"
export HF_HUB_DISABLE_TELEMETRY=1
unset HF_HUB_OFFLINE
unset TRANSFORMERS_OFFLINE
bash scripts/start.sh
```

`scripts/start.sh` binds `127.0.0.1:8000` and was not run on Arch from Windows. Wait until `curl -sS http://127.0.0.1:8000/api/health` shows `"status": "ready"`, then stop that process. Later launches use the offline flags.

## 4. Start the API for the classroom

```bash
cd /ABSOLUTE/PATH/TO/REPO
bash scripts/host.sh
```

Replace `/ABSOLUTE/PATH/TO/REPO` with the directory `pwd` prints after you clone. `scripts/host.sh` binds `0.0.0.0:8000`, sets `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`, and prints that you still have to run cloudflared and update `connect.json`. It does not do those two steps. It was written on Windows and was not executed on Arch.

Check:

```bash
curl -sS http://127.0.0.1:8000/api/health
curl -sS http://127.0.0.1:8000/api/host
```

`/api/host` returns `role`, `model`, and `device` from the health fields already in the process. It does not add GPU facts.

## 5. Open the quick tunnel

In a second terminal, from any directory:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

Read the `https://*.trycloudflare.com` URL in that output. There is no stable hostname. A new process gets a new URL.

Write repo-root `connect.json` only. `updatedAt` is UTC ISO-8601. A comment field is invalid JSON.

```bash
cd /ABSOLUTE/PATH/TO/REPO
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '%s\n' "{\"apiBase\":\"https://PUT-THE-TUNNEL-HOST.trycloudflare.com\",\"updatedAt\":\"$STAMP\"}" > connect.json
curl -sS "https://PUT-THE-TUNNEL-HOST.trycloudflare.com/api/health"
git status
git diff
git add connect.json
git commit -m "chore: publish the class tunnel URL"
git push
```

Commit only `connect.json`. Do not commit `.env`, `.venv`, `node_modules`, model weights, or Hugging Face caches. Do not force-push. If `git push` asks for credentials this user does not have, stop and say so. Do not invent a token.

The frontend reads that file from GitHub raw only after `GITHUB_CONNECT_RAW` in `frontend/src/api/connectSource.ts` is the raw URL of this repo's default branch, for example `https://raw.githubusercontent.com/OWNER/REPO/main/connect.json`, and that frontend has been deployed once. This Windows checkout had no git remote, so that constant is an empty string and the GitHub fetch is skipped until you set it, commit that source file, and redeploy the frontend once. After that, each new tunnel is a `connect.json` push only. The repo must be public: a browser cannot send a GitHub token to raw.githubusercontent.com. The page also fetches `/connect.json` on the Vercel host. That copy updates when the frontend is rebuilt. It is not the live path.

## 6. The tunnel is public

A quick tunnel is on the public internet until you stop the `cloudflared` process. Anyone with the URL can POST text to the model. The URL changes every launch, so `connect.json` has to be updated every launch. When class ends, stop cloudflared. To make clients stop trying the dead URL, set `connect.json` back to `{"apiBase":"","updatedAt":null}` and push that file.

## 7. Optional: `http://lingo.local:8000` on the classroom Wi-Fi

This does not help the Vercel `https://` page. It helps a teacher PC on the same Wi-Fi whose page is `http://` (`npm run dev`). Do not scan the LAN from the browser. Publish one name.

```bash
sudo pacman -S --needed avahi nss-mdns
sudo systemctl enable --now avahi-daemon
```

`/etc/avahi/services/lingo.service`:

```xml
<?xml version="1.0" standalone="no"?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">Lingo Translator</name>
  <service>
    <type>_http._tcp</type>
    <port>8000</port>
  </service>
</service-group>
```

That XML advertises the HTTP service. The name `lingo.local` comes from an A record. `/etc/systemd/system/lingo-local.service`:

```ini
[Unit]
Description=Publish lingo.local for the translator API
After=network-online.target avahi-daemon.service
Wants=network-online.target
Requires=avahi-daemon.service

[Service]
Type=simple
ExecStart=/usr/bin/bash /ABSOLUTE/PATH/TO/REPO/scripts/publish-lingo-local.sh
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

Replace `/ABSOLUTE/PATH/TO/REPO` with the clone path (`pwd`). Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lingo-local.service
getent hosts lingo.local || true
curl -sS http://lingo.local:8000/api/health
```

`scripts/publish-lingo-local.sh` takes the source address of the default IPv4 route. It was not run on Arch from Windows. If `getent` on the laptop does not resolve `lingo.local`, set the `hosts:` line in `/etc/nsswitch.conf` to:

```
hosts: mymachines mdns_minimal [NOTFOUND=return] resolve [!UNAVAIL=return] files myhostname dns
```

The teacher PC is Windows. On the same Wi-Fi, `ping lingo.local` should show the laptop address. If the laptop runs firewalld and the teacher still cannot connect, allow tcp/8000. Do not flush the firewall.

## 8. Teacher PC

Clone the repo. Two ways to open the translator:

- Open the Vercel URL. Slides are at `/slides` and do not need the GPU. The translator calls the laptop only when discovery finds a healthy API.
- Or, in `frontend/`: `npm install` once, then `npm run dev`. Vite listens on `127.0.0.1:5173` and proxies `/api` to `127.0.0.1:8000`. On an `http://` page, discovery then tries `http://127.0.0.1:8000` and `http://lingo.local:8000`.

A one-off tunnel for a single browser, only while the page is `https://`:

`https://THE-VERCEL-HOST/?api=https://THE-TUNNEL-HOST.trycloudflare.com`

A successful health check is stored in `localStorage` under `lingo.apiBase`.

## 9. Vercel

Project root: `frontend/`. Build command: `npm run build`. Output directory: `dist`. `frontend/vercel.json` rewrites unknown paths to `index.html` so `/slides` loads the SPA. Do not put the Python API on Vercel. Do not set `VITE_API_BASE`. Do not point the page at a cloud model.

If the Vercel CLI is not logged in, from `frontend/`:

```bash
npx vercel login
npx vercel link
npx vercel --prod --yes
```

If the Vercel project was created at the git repo root instead of `frontend/`, set Root Directory to `frontend` in Project Settings → General, then redeploy. The dashboard build command stays `npm run build` and the output directory stays `dist`.

## 10. Discovery order the page uses

Each probe waits about 1.5 seconds.

1. `?api=` when it is an `http(s)` URL. On an `https://` page the value must be `https://`. A success is saved in `localStorage`.
2. Same-origin `GET /api/health` (the Vite proxy, or a future same-origin API).
3. Only when the page itself is `http://`: `http://127.0.0.1:8000`, then `http://lingo.local:8000`.
4. `connect.json`, cache-busted, from `GITHUB_CONNECT_RAW` when that constant is non-empty, and from `/connect.json` on the site. `apiBase` is used only when it is `https://` and `GET {apiBase}/api/health` returns `ready` or `loading`. `""` is skipped.
5. The last successful explicit base in `localStorage`, if it is still healthy and the page protocol allows it.

The status line shows the host that won. If none win, the status says the laptop is offline and the slides still work.
