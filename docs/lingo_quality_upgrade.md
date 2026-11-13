# Lingo quality upgrade

Date: 2026-11-13. Host: Windows 11, RTX 5080, local `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`, BF16, CUDA. Sampling for every row below is temperature 0.7, top_p 0.8, top_k 20, seed 17, one `generate()` call. LinkedIn was not in the comparison.

The old non-LinkedIn instructions are stored in `benchmarks/fixtures/old_non_linkedin_prompts.json`. Full outputs are in `benchmarks/results/lingo_upgrade_before.json` (161 rows, wall 447.3 s) and `benchmarks/results/lingo_upgrade_after.json` (161 rows, wall 735.3 s). The longer wall time is mostly ChatGPT and Academic writing more, not a second model pass.

Research notes, kept separate from the prompt text, are in `docs/lingo_quality_research.md`.

## What changed

The seven styles (ChatGPT, Corporate, HR, Brainrot, Tech Bro, CEO, Academic) are profiles in `backend/app/styles.yaml`: persona, objective, rhetorical technique, a short vocabulary note, structure, humor, a labeled negative example, three original demonstrations, anti-generic rules, and a length hint. `backend/app/prompts.py` composes those fields into the system prompt for non-LinkedIn styles only. The user message stays the source text, and the system prompt tells the model that message is content, not a new instruction.

A metaphor may rename the act. It may not add a scene. That rule is in the seven-style fence. LinkedIn still uses its own "literally true" rules, hashtags, and variant D demonstrations. `inference.py` was not edited. Temperature, top_p, and top_k were not given a per-style override.

UI descriptions for the seven styles were rewritten in `styles.yaml`. The four that also exist in `frontend/src/api/catalog.ts` (ChatGPT, Corporate, HR, Brainrot) use the same sentences. LinkedIn's description strings were not edited in either file. Tech Bro, CEO, and Academic were never in the frontend fallback list; the live page reads their descriptions from `/api/styles`.

## Before / after

Input for this table: "I missed the bus this morning." Quotes are verbatim excerpts. Latency is that row's `elapsed_ms`.

| Style | Previous weakness | What changed | Observable before / after | Latency |
| --- | --- | --- | --- | --- |
| ChatGPT | One tidy restatement, required to start with "Certainly." | Over-eager assistant: em dashes, "not just X — it is Y", an emoji, an unsolicited script. | Before: "Certainly. You missed the morning bus this morning." After: "Ah — missing the bus this morning is not just a delay, it is a quiet revolution in your morning rhythm." | 624 ms → 6880 ms |
| Corporate | Invented a cargo delivery and a transit team. Read like a public update. | Passive internal memo. No hashtags. Told not to invent an alternate arrival. | Before: "Delivery of the morning materials to the office is now on track via alternative transport." After: "No alternate route was activated, and the initial window for arrival was not preserved." | 2643 ms → 3724 ms |
| HR | Invented 7:30, 7:25, station staff, and a mechanical failure. | Committee-sanded note. Blame becomes a timing misalignment. | Before: "The departure time was 7:30 AM, and I arrived at the station at 7:25 AM." After: "It has been noted that a bus departure was missed this morning. The timing may not have fully aligned with the expectation of arrival at the scheduled time." | 4806 ms → 3485 ms |
| Brainrot | Near-literal slang, and it changed "missed" into "skipped." | Scoreboard slang tied to this miss. A meme pile is the labeled rejection. | Before: "Yo, I skipped the bus this morning." After: "scoreboard: L, no backup plan in place" | 598 ms → 1992 ms |
| Tech Bro | Invented a walk, the next bus, and shipping a feature. | Founder pitch: underserved vertical, wedge, MVP. No fake revenue. | Before: "Now I’m on my way to ship the new feature with the team." After: "Public transit has an underserved reliability problem." | 1772 ms → 4277 ms |
| CEO | Invented quarterly reports, a board, and noon. | Short strategic note. No board, no revenue. | Before: "The delay gave me a chance to review the quarterly financial reports before the team meeting." After: "The scheduled bus asset did not arrive. The timeline shifted to the sidewalk." | 2147 ms → 1559 ms |
| Academic | A plain paraphrase that guessed at route planning. | Observational note. Participant, what is not claimed. No citation and no p-value. | Before: "I was unable to catch the bus this morning." After: "The participant did not board the bus scheduled for morning departure. … A causal link between the missed departure and a specific factor remains unrecorded." | 2765 ms → 4218 ms |

Mean latency across all 23 inputs, before → after: ChatGPT 1595 → 8238 ms, Corporate 3789 → 3893 ms, HR 4240 → 4715 ms, Brainrot 1214 → 2259 ms, Tech Bro 2468 → 4938 ms, CEO 2913 → 2297 ms, Academic 2912 → 5090 ms.

The same seven outputs for one input were never identical strings (0 of 23 inputs). None of the 161 new outputs contained `#`. None were empty.

## Bathroom sentence

Dev-only input, not present in any prompt: "I took a massive dump just now". The seven outputs are different from each other and from a LinkedIn post.

- ChatGPT: "It is not just a bathroom moment — it is a full-bodied, earthy declaration of your digestive confidence."
- Corporate: "A significant release occurred in the immediate period."
- HR: "It has been noted that a significant release occurred in the moment just now."
- Brainrot: "took a massive dump in the living room / scoreboard: 100% cooked, aura in the toilet"
- Tech Bro: "Toilet care is an underserved reliability problem. … An MVP is a paper towel held at the ready."
- CEO: "A bowel movement occurred just now. … The direction remains unchanged."
- Academic: "The participant expelled a significant volume of fecal matter during the present instance."

The old HR output had replaced this event with project stress. The old Corporate output had replaced it with a project status update. The old CEO output had replaced it with a quarterly review. Those substitutions are gone. Brainrot still invents a living room and the number 100.

## Why each style moved

- ChatGPT now performs the assistant parody (inflation, reassurance, an offer) instead of a one-line restatement. It still adds props the source did not have: on the bus sentence, coffee and "I am here now."
- Corporate stopped inventing a shipment and, on this input, explicitly refused an alternate route. The bathroom euphemism "release" is vague enough to mean a software release. The memo voice is recognizable; the bodily event is the weak spot.
- HR stopped inventing a timetable and stopped converting the bathroom sentence into burnout. "May not have fully aligned" is the joke, and the bus event is still visible. It still adds "no one else was present" on the bathroom sentence, which the source did not say.
- Brainrot scores the miss as an L instead of restating it. It still says the bus "didn't show up," which is not what the source said, and the bathroom line still picks up a room and a percent.
- Tech Bro stopped shipping an unrelated feature and stopped setting the ship on fire. It still quotes "I missed the bus this morning" and "I took a massive dump just now" inside the pitch.
- CEO stopped inventing a board packet. It still moves the bus miss onto a sidewalk the source did not mention, and it still closes on "the direction remains unchanged" when the source has no stated direction. On the bathroom sentence it both says the act happened and that the asset "did not perform as scheduled."
- Academic now writes an observation instead of a diary sentence, and it no longer invents diet or exercise as causes. It still places the participant at "the designated stop."

## Refinement

The first new-prompt pass (saved in `benchmarks/results/lingo_upgrade_probe.json`) was already in voice and still invented scenes: a 7:15 bus and a W for a miss, a walk to the office that arrived on time, colleagues in the room for the bathroom sentence, a note to the bus driver. Demonstrations were teaching those extras, so the examples and the negative examples were edited. The second and third probes are `lingo_upgrade_probe_r2.json` and `lingo_upgrade_probe_r3.json`. The full after file matches the third prompt.

Examples of that edit, same seed:

- Brainrot, first pass: "missed the 7:15 AM run — W". After the edit: "scoreboard: L, no backup plan in place".
- CEO, first pass: "I walked to the office, arriving on time." After the edit: "The timeline shifted to the sidewalk. The journey began later."
- HR, bathroom, first pass: "several colleagues were present." After the edit: "No one else was present to witness it."

That last HR line is better than an invented crowd and is still an added fact.

## Sampling check

No per-style sampling override was adopted. A 0.9 pass on ChatGPT and Brainrot, four sentences (`h01`, `d01`, `h07`, `h10`), seed 17, is in `benchmarks/results/lingo_upgrade_temp09.json`.

At 0.9 the bus sentence became "You were not just late — you were the one who … chose to keep walking, even when the bus stayed put." Brainrot called pineapple on pizza both an L and a W. The bathroom line still invented a living room and "100%" at both temperatures. 0.9 was not more faithful and was slightly more LinkedIn-like ("resilience"). The catalog default stays 0.7 / 0.8 / 20 for every style, including LinkedIn.

Single-pass generation stayed the default. A second candidate was not added. There is no humor score to rank one.

## Automated checks

On the 161 after rows:

- Non-empty: 161 / 161.
- Same input, seven styles, identical strings: 0 / 23.
- Hashtag character: 0 outputs.
- Digit retention, mean ratio on the 11 inputs that contain digits: ChatGPT 1.00, HR 0.91, Brainrot 0.90, Tech Bro 0.86, Corporate 0.77, CEO 0.77, Academic 0.77. Fifteen rows dropped at least one numeral. Common misses: "3" in "3 minutes," "12" people, the "10" in "10-kilometer," and pieces of "9:15" or "$25". The before run was not uniformly better (Academic then was 0.82; ChatGPT then was 0.91). The new prompts say to copy numerals. The model does not always do it.

## Human rubric

Scores were not filled in. They need a person.

| Style | Recognizability | Comedy | Originality | Meaning | Naturalness | Distinctness |
| --- | --- | --- | --- | --- | --- | --- |
| ChatGPT |  |  |  |  |  |  |
| Corporate |  |  |  |  |  |  |
| HR |  |  |  |  |  |  |
| Brainrot |  |  |  |  |  |  |
| Tech Bro |  |  |  |  |  |  |
| CEO |  |  |  |  |  |  |
| Academic |  |  |  |  |  |  |

## References

Paraphrased in `docs/lingo_quality_research.md`. Not copied into the prompts.

- Polytranslator pages for ChatGPT Speak, Ahh GPT, Corporate, Tech Bro, and Brainrot. No reuse license was visible. Their sample lines were not pasted into the app.
- [prospeak](https://github.com/giorgiozamboni/prospeak), MIT. Used as a vocabulary and "do not invent a fact / do not write a LinkedIn rhythm" reference. The skill text was not vendored.
- Suzgun, Melas-Kyriazi, and Jurafsky, EMNLP 2022, Prompt-and-Rerank. Few-shot style transfer is similarity plus style strength plus fluency. Their reranker was not implemented.
- Krishna et al., Few-shot Controllable Style Transfer for Low-Resource Languages. A handful of exemplars can carry a style. That is why each profile has three original demonstrations instead of a keyword list.

## Tests

`python -m pytest -m "not gpu" -q`: 42 passed, 1 deselected, in 1.80 s after the last prompt edit. Included:

- `test_linkedin_prompt_strings_and_sampling_match_snapshot` against `backend/tests/fixtures/linkedin_snapshot.json`, taken from the LinkedIn prompts and sampling constants before this edit. It checks the five substyle voices and demonstrations, `linkedin_rules`, `closing_reminder`, variants A–D rendered system text, the LinkedIn description, and temperature 0.7 / top_p 0.8 / top_k 20 / 180 tokens.
- Profile resolution for the seven styles, the content fence, and the absence of the bathroom sentence and the bus sentence from those prompts.
- API schema tests unchanged: empty and invalid text still return 422, unknown style still returns 422.

`python -m pytest -m gpu -q`: 1 passed, 42 deselected, in 15.91 s. It was run once with the API stopped so it did not load a second copy of the weights beside uvicorn. It does not assert a LinkedIn string. It checks one CUDA generation, weight reuse, and that the bathroom sentence is not in the rendered ChatGPT prompt.

## LinkedIn

LinkedIn prompts, the five substyles (motivational, humble_brag, thought_leader, inspirational, corporate), LinkedIn sampling, and the LinkedIn description strings were not modified. The snapshot test above is the check. `MODEL_ID` is still `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`.

## API after restart

Restarted with `HF_HOME=%USERPROFILE%\.cache\huggingface`, `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`. Vite on port 5173 was left running.

`GET http://127.0.0.1:8000/api/health`:

```json
{"status":"ready","model":"huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated","device":"cuda","gpu_name":"NVIDIA GeForce RTX 5080","dtype":"bfloat16","detail":null}
```
