# Lingo Translator

Local web UI for the school rewrite desk. The page sends a sentence to the API on this machine and shows whatever comes back. It does not call a cloud model, and it will not invent a translation if the API is down or the model is still loading.

## Run

The API must be listening on port **8000**.

```bash
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to http://127.0.0.1:8000.

Choose a style, write a sentence (4000 characters max), and press Translate or Ctrl+Enter. LinkedIn opens a tone control. Creativity controls — temperature and max new tokens — stay collapsed; the defaults are 0.7 and 180.

## Scripts

- `npm run dev` — dev server on port 5173
- `npm run build` — typecheck and production build
- `npm run preview` — serve the production build (same port and `/api` proxy)
