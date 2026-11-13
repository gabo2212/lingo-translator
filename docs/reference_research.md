# Reference research

Synthesis date: 2026-11-13. This file records what was observed and what this project does instead. The inspection notes it rests on were not rewritten:

- `docs/research/01_existing_project.md`
- `docs/research/02_reference_repos.md`
- `docs/research/03_model_and_environment.md`

## Links

| Item | URL | What was actually seen |
| --- | --- | --- |
| LinkedIn-Translator | https://github.com/c0reM/LinkedIn-Translator | Read on 2026-11-13. Default branch `main`, commit `acdbc5e7a788d10d7ac5829766cc770924fe1796` (2026-03-22). Files read: `README.md`, `package.json`, `wrangler.toml`, `src/index.js`. |
| tonal | https://github.com/kwakhare5/tonal | HTTP 404 on the GitHub API, the raw README, and repository search on 2026-11-13. No source, prompt, or license could be read. |
| Model | https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507 | Non-thinking instruct checkpoint. Apache 2.0. Card and `generation_config.json` agree on sampling. |
| Qwen docs | https://qwen.readthedocs.io/en/latest/ and https://qwenlm.github.io/blog/qwen3/ | Linked from the model card. |
| PyTorch install | https://pytorch.org/get-started/locally/ | Rechecked at install time. The page is a selector. The wheel index that matches this machine's CUDA UMD 13.4 and ships a Windows cp312 build with `sm_120` is https://download.pytorch.org/whl/cu134 (`torch==2.15.0+cu134`). |
| Assignment | `C:\Users\tdgf\Downloads\TP_Algorithmes_ML_Entrevue_et_Mini_Projet-final.docx` | French handout. One algorithm, a small Python program, a 7–10 minute talk with a 2–3 minute demo, and a 1–2 page synthesis. A pretrained model is allowed if the student's own contribution is stated. |

## License

**c0reM/LinkedIn-Translator has no license file.** The GitHub license API returns 404. `README.md`, `package.json`, and `src/index.js` contain no SPDX identifier and no reuse grant. Default copyright applies. This project does **not** copy that repository's source, prompt strings, CSS, or frontend. The behavior below is the only thing reused, and the prompts in `backend/app/styles.yaml` are original.

**kwakhare5/tonal is unreadable (404).** A cached landing page called the project open-source. That sentence is not a license. Nothing from tonal was copied. The only idea kept from the public description is that a tone is a rewrite of a draft the user already wrote, not a new essay. This app does not inject itself into Gmail, Slack, or LinkedIn, and it does not call Groq.

**Qwen/Qwen3-4B-Instruct-2507 is Apache 2.0.** The weights are downloaded into the Hugging Face cache. They are not vendored into git.

## Observed LinkedIn-Translator behavior

It is one Cloudflare Worker that sends English text to Google Gemini (`gemini-2.0-flash`) and shows the result like a translator: source on the left, rewrite on the right, five tone chips, Translate on a button or Ctrl/Cmd+Enter. The swap control is visual only. Empty text returns HTTP 400. The success body is `{ "result": "<text>" }`.

The five tones are motivational, humble-brag, thought-leader, inspirational, and corporate. Shared behavior, paraphrased from the inspection (not pasted into our prompt):

- Workplace language that, read literally, still describes the original event.
- A reader who does not know the source should think it is an ordinary professional post.
- The humor is the contrast. The post never winks, never names the original topic, and never explains the joke.
- Short posts plus 2–3 hashtags. Inspirational is a little longer (about 4–6 sentences).
- Concrete scale, timing, completion, and consequence stay recoverable. A vague "I completed a personal task" fails that rule.

The published motivational illustration turns a private bodily event into a completed high-volume session that clears capacity for whatever comes next, with productivity hashtags and no joke marker. That pair is an evaluation fixture. Temperature on Gemini was 1.2, so the illustration is not a deterministic answer. This project does not hardcode it and does not put that source sentence inside the style prompt. It lives only in `benchmarks/dev_sentences.json`.

Gemini settings that we do **not** copy: temperature 1.2, `maxOutputTokens` 200 as a Gemini-specific knob, `BLOCK_NONE` safety switches, the Gemini API key, and the text-to-speech route.

## What this implementation does instead

| Reference behavior | This project |
| --- | --- |
| Hosted Gemini 2.0 Flash | Local `Qwen/Qwen3-4B-Instruct-2507` on CUDA, BF16, kept resident |
| Temperature 1.2, no top-p / top-k | Start from the Qwen card: temperature 0.7, top_p 0.8, top_k 20, `do_sample` true. 0.9 and 1.1 are compared on a small dev slice and the winner is recorded in `docs/evaluation_report.md` |
| One user message that mixes rules and source text | System message = original style rules. User message = the source text only. ChatML via `apply_chat_template` |
| Their five prompt strings | Original instructions and 2–3 original demonstrations per LinkedIn substyle in `styles.yaml` |
| Tone ids with hyphens (`humble-brag`) | Ids with underscores (`humble_brag`, `thought_leader`) because that is the API contract |
| LinkedIn only | LinkedIn substyles, plus ChatGPT, general corporate, HR, brainrot, and optional tech-bro, CEO, and academic voices |
| Cloudflare Worker, Gemini key | FastAPI on `127.0.0.1:8000`. No cloud model client |
| Unknown tone falls through to motivational | Unknown style or unknown LinkedIn tone returns HTTP 422. Omitted LinkedIn tone defaults to motivational |
| No second pass | A second rewrite exists in code and defaults to **off** (`second_pass.enabled` in `styles.yaml`) |
| Their HTML/CSS | Not copied. Another person owns `frontend/`. This repo does not create that folder |

Tonal's two-way "decode the jargon" mode and its browser extension were not implemented. The source text and the rewrite are both available to the caller, which is enough to check that a metaphor still matches the event.
