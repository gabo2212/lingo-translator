# Reference repositories (behavior only)

Inspection date: 2026-11-13. This note records observed behavior so a student project can imitate the idea with original code. It does not add application source to the workspace.

Sources read:

- [c0reM/LinkedIn-Translator](https://github.com/c0reM/LinkedIn-Translator), default branch `main`, commit `acdbc5e7a788d10d7ac5829766cc770924fe1796` (2026-03-22). Files read: `README.md`, `package.json`, `wrangler.toml`, and `src/index.js` (the only file under `src/`). `callGemini()` is lines 766–829. The five `tonePrompts` are lines 767–787.
- [kwakhare5/tonal](https://github.com/kwakhare5/tonal) could not be read. See the tonal section. No tonal source was copied.

No file in this workspace other than this note was edited. The prompts quoted below are short instructional strings, cited so the behavior can be adapted. They are not a license to paste the repository's application code into the student project.

## License conclusion

**LinkedIn-Translator: do not copy its source.** The repository has no `LICENSE` file. GitHub's license API returns 404 for this repo. `README.md`, `package.json`, and `src/index.js` contain no SPDX identifier, copyright notice, or reuse grant. With no explicit permission, default copyright applies. Do not copy protected source into the student project; use this repository as a behavioral and architectural reference only and write original code.

**tonal: do not copy its source either.** The GitHub repository returned 404 on 2026-11-13 (API, raw README, and repository search). No `LICENSE` file could be read. A cached public landing page claimed the project was "open-source," which is a marketing sentence, not a license grant. Do not copy protected source into the student project; use publicly described behavior as a reference only and write original code.

## Observed repository behavior

### LinkedIn-Translator — what it is

Public description: "Translate anything into LinkedIn speak." The README calls it a Google Translate-style page that turns plain English into LinkedIn corporate speech with Google Gemini. It is one Cloudflare Worker. `package.json` names `src/index.js` as `main`. Scripts are `wrangler dev` and `wrangler deploy`. `wrangler.toml` sets `name = "linkedin-translator"`, `main = "src/index.js"`, and `compatibility_date = "2024-01-01"`. The Gemini key is a Worker secret, `GEMINI_API_KEY`, not a value in the repo.

There is no test directory, no separate frontend package, and no license file. UI, CSS, client script, translation, and optional speech are all inside `src/index.js`.

Commit messages on 2026-03-22 state the design intent in the author's words: the joke is the subtext; corporate metaphors should literally describe the original while reading as genuine LinkedIn; the model should never wink and never name the original topic; posts were shortened to a few sentences; `maxOutputTokens` was reduced from 512 to 200.

### Frontend: how a translation is submitted

The page is a two-panel translator.

1. Header: "LinkedIn Translator."
2. Language bar: "English" on the left, "LinkedIn Speak" on the right, with a swap icon between them. No click handler is attached to the swap control or the language labels. Swap is visual only. Translation is one way, English to LinkedIn speak.
3. Tone picker labeled "Translation tone." Five chips. The active chip starts as Motivational. Clicking a chip sets `activeTone` and does not call the API. The user must translate again to apply the new tone.
4. Left panel: a textarea (`maxlength` 5000), placeholder "Enter text to translate...", a live `n / 5000` counter, Clear, Listen, and Translate. Translate stays disabled while the box is empty.
5. Right panel: placeholder text "Translation", then the result. A "Best" badge is static decoration (the Google Translate heart), not a quality score. Copy and Listen appear after a successful result.
6. Example chips under the panels fill the textarea and immediately translate. The first example is `I took a massive dump just now`. Others: fired today, nothing productive, woke up before noon, ate lunch at the desk alone, three hours on Twitter, a terrible meeting.

Submit path:

- Button click, or Ctrl+Enter / Cmd+Enter, runs `doTranslate()`.
- Client `POST /translate` with `Content-Type: application/json` and body `{ "text": "<trimmed input>", "tone": "<activeTone>" }`.
- While waiting, the output shows "Translating to LinkedIn speak...".
- Success: `data.result` is shown as plain text (not HTML), and Copy / Listen are revealed.
- Failure: the output returns to the placeholder and `data.error` (or a fallback string) is shown in an error banner.

Server handler for `POST /translate`:

- Requires `env.GEMINI_API_KEY`. If missing, HTTP 500 with a configuration error.
- Trims `body.text` and slices it to 5000 characters. Empty text returns HTTP 400, `{ "error": "No text provided" }`.
- Tone defaults to `motivational` when omitted. An unknown tone id also falls through to the motivational prompt inside `callGemini`.
- Success body is `{ "result": "<trimmed model text>" }`. Exceptions return HTTP 500 and `{ "error": "<message>" }`.

A second route, `POST /tts`, reads the input or the result aloud via `gemini-2.5-pro-preview-tts`, voice name `Leda`, temperature 1. That path is separate from translation. Any other GET returns the HTML page.

Tone ids and visible labels:

| `data-tone` | Label |
| --- | --- |
| `motivational` | Motivational |
| `humble-brag` | Humble Brag |
| `thought-leader` | Thought Leader |
| `inspirational` | Inspirational Story |
| `corporate` | Corporate Jargon |

### Model and generation settings

`callGemini(apiKey, text, tone)` does not use a separate system role. It looks up one prompt string, then sends a single user part:

```text
<tone prompt>

Original text: "<text>"

LinkedIn post:
```

HTTP `POST` to:

`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<GEMINI_API_KEY>`

`generationConfig` observed in source:

| Setting | Value |
| --- | --- |
| Model | `gemini-2.0-flash` |
| `temperature` | `1.2` |
| `maxOutputTokens` | `200` |
| `topP` / `topK` | not set |
| Response used | `candidates[0].content.parts[0].text`, then `trim()` |

`safetySettings` on that call: harassment `BLOCK_NONE`, hate speech `BLOCK_NONE`, sexually explicit `BLOCK_MEDIUM_AND_ABOVE`, dangerous content `BLOCK_NONE`. Those thresholds are Gemini API options. They are not a behavior to reproduce on a local model. The writing rules below are what create the joke.

The README's motivational sample is an illustration, not a guaranteed completion. Temperature 1.2 means the same input can come back worded differently. Do not hardcode that sample as the only correct output.

### Shared rules inside every tone prompt

Each prompt opens with "You are a LinkedIn ghostwriter" and asks for a short post plus 2–3 hashtags. The shared mechanism, present in all five:

- Choose language that, taken literally, still describes exactly what the original text is about.
- A reader who does not know the source should think it is an ordinary LinkedIn post.
- "The comedy is purely in the double meaning."
- "Never reference the original topic directly."
- Write straight. No wink, no "just kidding," no quote of the user's slang.

Meaning is preserved by literal truth of the metaphor, not by a vague summary. The disguise is a register change: workplace nouns replace the everyday nouns, while number, timing, completion, scale, and consequence stay recoverable. Humor is the gap between the sincere post and the known mundane event. If the metaphor would be false when read literally, the prompt's rule has been missed.

### Tone: `motivational`

**Intended writing style.** A proud, earnest motivational post. Business and productivity metaphors. The author sounds pleased with a real accomplishment.

**Exact behavioral instructions.**

> You are a LinkedIn ghostwriter. Translate the following text into a short motivational LinkedIn post (3–5 sentences + 2–3 hashtags).
>
> The key rule: choose business and productivity metaphors that, taken literally, accurately describe exactly what the original text is about — but read as completely sincere corporate content to anyone who doesn't know the source. The comedy is purely in the double meaning. Never reference the original topic directly. Write with total earnestness, as if this is a genuine post someone is proud of.

**How meaning is preserved.** Productivity words have to stay true if someone takes them at face value: completion, volume, speed, preparation, capacity, a next step. Dropping those facts for generic praise fails the rule.

**Metaphors and double meaning.** The humor is a workplace metaphor that is also a straight description. The post never signals that a second meaning exists.

**How the topic is disguised.** The original domain is not named, hinted at with slang, or put in quotes. Only the metaphor vocabulary is visible.

**Length, hashtags, presentation.** 3–5 sentences and 2–3 hashtags. The published README sample is shorter than that (two sentences and three hashtags). Hashtags in that sample are CamelCase productivity tags with no spaces.

**Rules to retain or adapt for local Qwen3-4B-Instruct.** Retain the literal-metaphor rule, the ban on naming the topic, earnest tone, and a short post with a few hashtags. Do not copy temperature 1.2. A 4B instruct model at that temperature more often names the topic or pads. See the adaptation section.

### Tone: `humble-brag`

**Intended writing style.** Modest on the surface, still a boast. Self-effacing business language that a LinkedIn reader would accept as humility.

**Exact behavioral instructions.**

> You are a LinkedIn ghostwriter. Translate the following text into a short humble-brag LinkedIn post (3–5 sentences + 2–3 hashtags).
>
> The key rule: choose modest, self-effacing business language that, taken literally, accurately describes exactly what the original text is about — but reads as genuine LinkedIn humility to anyone who doesn't know the source. The comedy is purely in the double meaning. Never reference the original topic directly. Write with total sincerity.

**How meaning is preserved.** The same literal-accuracy rule as motivational. The difference is stance: credit is downplayed ("grateful," "still learning," "small win") while the underlying scale of the event remains in the words.

**Metaphors and double meaning.** The brag and the modesty are both about the real event. A reader in on the source hears the boast inside the apology. A reader who is not hears a normal humble post.

**How the topic is disguised.** Same ban: never name the original topic. Humility is the costume, not a confession.

**Length, hashtags, presentation.** 3–5 sentences + 2–3 hashtags. No separate sample is published for this tone.

**Rules to retain or adapt.** Retain modesty-plus-literal-truth and total sincerity. Adapt sampling and length control for a 4B model so it does not slide into open sarcasm. Sarcasm would break "total sincerity."

### Tone: `thought-leader`

**Intended writing style.** A short opinion post. It must open with "Unpopular opinion:" or another bold statement, then treat the event as an industry insight.

**Exact behavioral instructions.**

> You are a LinkedIn ghostwriter. Translate the following text into a short thought leadership LinkedIn post (3–5 sentences + 2–3 hashtags). Open with "Unpopular opinion:" or a bold statement.
>
> The key rule: frame the original event as a business insight or industry truth using metaphors that, taken literally, accurately describe exactly what the original text is about — but sound like genuine professional wisdom to anyone who doesn't know the source. The comedy is purely in the double meaning. Never reference the original topic directly. Write with total conviction.

**How meaning is preserved.** The "insight" has to be a restatement of what actually happened (timing, scale, outcome), presented as a general business lesson.

**Metaphors and double meaning.** Conviction sells the cover story. The double meaning is an industry proverb that is also a precise account of the private event.

**How the topic is disguised.** The opener sounds like thought leadership, so the reader expects a take, not a diary entry. The topic stays inside the metaphor.

**Length, hashtags, presentation.** 3–5 sentences + 2–3 hashtags, with a required bold opener. That opener is the only tone that demands a specific phrase class.

**Rules to retain or adapt.** Retain the opener constraint and the "insight that is still literally true" rule. For a 4B model, put the opener requirement at the end of the instruction as well as the start, or the model often forgets it.

### Tone: `inspirational`

**Intended writing style.** A longer personal story. Warmth and vulnerability. The event is a growth moment, not a KPI update.

**Exact behavioral instructions.**

> You are a LinkedIn ghostwriter. Translate the following text into a short inspirational LinkedIn story (4–6 sentences + 2–3 hashtags).
>
> The key rule: frame the original event as a personal growth moment using language that, taken literally, accurately describes exactly what the original text is about — but reads as an authentic human story to anyone who doesn't know the source. The comedy is purely in the double meaning. Never reference the original topic directly. Write with genuine warmth and vulnerability.

**How meaning is preserved.** Story order can follow the real sequence (before, the moment, the aftermath) as long as each beat stays literally true. This is the only tone that asks for 4–6 sentences.

**Metaphors and double meaning.** The warmth is real in tone and double in content. Vulnerability is about the actual difficulty or relief, described as a career or life lesson.

**How the topic is disguised.** First person and a lesson learned replace the plain description. The domain word never appears.

**Length, hashtags, presentation.** 4–6 sentences + 2–3 hashtags. Still far below the old 512-token cap. The 200-token ceiling applies to this longer tone too, so the model is pushed to stay compact.

**Rules to retain or adapt.** Retain warmth without naming the topic, and the slightly longer sentence band. On a 4B model, 4–6 sentences plus hashtags can hit a hard token cap mid-tag. Prefer finishing the hashtags over adding a sixth sentence.

### Tone: `corporate`

**Intended writing style.** A routine operations update. Bland confidence. The prompt names a vocabulary set: process, output, delivery, capacity, throughput, pipeline.

**Exact behavioral instructions.**

> You are a LinkedIn ghostwriter. Translate the following text into a short corporate update LinkedIn post (3–5 sentences + 2–3 hashtags).
>
> The key rule: use business operations language — process, output, delivery, capacity, throughput, pipeline — that, taken literally, accurately describes exactly what the original text is about — but reads as a routine professional update to anyone who doesn't know the source. The comedy is purely in the double meaning. Never reference the original topic directly. Write with bland professional confidence.

**How meaning is preserved.** Those operations nouns are not decoration. Each one used should still denote something true about the event (an output occurred, capacity changed, a pipeline moved). Stacking jargon that does not map is a miss.

**Metaphors and double meaning.** This is the flattest voice. Humor comes from how ordinary the update sounds, not from hype. Motivational pride and corporate blandness are different costumes on the same literal-truth rule.

**How the topic is disguised.** Status-update syntax (what shipped, what capacity remains) hides the domestic or bodily event.

**Length, hashtags, presentation.** 3–5 sentences + 2–3 hashtags. Tone should stay dry.

**Rules to retain or adapt.** Retain a small operations lexicon and the requirement that each term stay literally true. A 4B model will often dump the whole word list into one sentence. The adaptation should ask for a few fitting terms, not every term every time.

### Golden example (evaluation fixture, not a hardcoded answer)

This pair is the README's Motivational illustration. It matches the sample the student described. It is a target style, not a string the program should return whenever it sees that input. Temperature 1.2 would not make Gemini deterministic, and a local model should generalize past this one sentence.

Input:

> I took a massive dump just now

README "LinkedIn Speak (Motivational)":

> I just successfully completed a high-volume output optimization session. It's all about streamlining processes and making room for the next big challenge. #Efficiency #GrowthMindset #ProductivityHacks

Why this works:

- **Recognizable metaphor.** "High-volume output" and "making room" still describe the event if read literally. Someone who knows the input can map every phrase back. Someone who does not still sees a coherent work post.
- **Serious tone.** "Successfully completed," "optimization session," and "next big challenge" are proud and straight. There is no wink.
- **Mundane event as achievement.** A private bodily moment is reported as a finished work session the author is proud of.
- **Terminology maps onto the real event.** "Just" keeps "just now." "Completed" keeps that it already happened. "High-volume" keeps "massive." "Output" keeps the result without naming it. "Streamlining" and "making room for the next" keep the aftermath: capacity was cleared.
- **Humor from contrast.** The laugh is the distance between the bathroom fact and the sincere productivity post. The post would be boring on LinkedIn, which is why it is funny here.

A bad generic paraphrase:

> I successfully completed a personal task today...

That fails the observed rules. "Personal task" is a category, not a metaphor that is still true in detail. "Today" loses "just now." Nothing carries volume, output, or the newly freed capacity. A stranger learns almost nothing, and a person who knows the input has no second meaning to notice. There is no earnest LinkedIn costume and no hashtag line. Vague uplift is not this product's joke.

### Repo shape worth imitating, without copying it

Useful architecture, to be rebuilt in original code:

- Two panels: source text on the left, styled rewrite on the right.
- A tone picker with stable ids (`motivational`, `humble-brag`, `thought-leader`, `inspirational`, `corporate`) separate from the visible labels.
- One translate request: text plus tone id in, plain text out.
- Example phrases that demonstrate the joke, including ordinary failures (fired, did nothing, bad meeting), not only the bathroom line.
- A character ceiling and an empty-input check before the model call.
- Unknown tone falls back to a default instead of crashing.

The reference puts HTML, CSS, and the model call in one file, and its swap button does nothing. Those are not patterns to copy. A student app can keep prompts as data and the UI as a separate view. Speech synthesis is optional and unrelated to the writing behavior.

### kwakhare5/tonal — access and public description

Checked on 2026-11-13:

- `GET https://api.github.com/repos/kwakhare5/tonal` returns 404.
- Raw `README.md` on `main` returns 404.
- GitHub repository search for `kwakhare5 tonal` returns 0 repositories.
- `GET https://api.github.com/users/kwakhare5/repos` lists other public repos (Grocer, Outpost, Git-for-Prompts, and others) and does not list `tonal`.
- The Internet Archive calendar for that GitHub URL has no snapshot.
- `https://tonall.vercel.app/` now returns Vercel's `DEPLOYMENT_NOT_FOUND`. The extension zip URL on that host failed the same way.
- No prompt text, generation settings, or `LICENSE` file from this repo could be read. Nothing below is quoted from its source, because the source was not available.

What is still public, from a GitHub topic index and from a cached copy of the author's portfolio and landing page (cache timestamps on the fetched pages were 2026-09-10 and 2026-10-09; the live portfolio on 2026-11-13 no longer lists Tonal):

- Topic blurb: "Two-way tone translator for Gmail, Slack, and LinkedIn. Turns rough drafts into clear work chat and decodes corporate jargon inline. Powered by Groq & Cloudflare Workers."
- Cached portfolio blurb: a Chrome extension that rewrites rough drafts into Slack, Gmail, and LinkedIn messages, stack listed as Groq LLMs, Cloudflare Workers, TypeScript, Next.js, and a Chrome extension.
- Cached landing page: inline rewrite inside Gmail, Slack, and LinkedIn; a floating tone control; Ctrl+Shift+T; per-site remembered tone; undo of recent rewrites; keep line breaks and lists; a second direction that decodes corporate jargon when text is selected. The page names Groq and Llama 3.3 70B and claims sub-second rewrites. It also claims the project is free and open-source and that users can supply their own Groq key. Those claims were not verifiable against a repository.

**License.** Not established. No license text was readable. The "open-source" FAQ line is not permission to copy. Do not copy protected source into the student project; use as a behavioral reference only and write original code.

**Ideas worth adapting (behavior and UI only).**

- Tone is a rewrite of a draft the user already wrote, not a new essay on a topic.
- Two directions are more honest than a decorative swap button: plain language to a channel voice, and jargon back to plain language.
- Channel changes the voice (mail, chat, LinkedIn). LinkedIn-Translator only has LinkedIn.
- Preserve the user's line breaks instead of always emitting one paragraph plus hashtags.
- Show the original beside the rewrite and let the user undo. That makes the metaphor checkable, which is how the LinkedIn joke stays honest.
- Remember the last tone. LinkedIn-Translator already keeps a selected chip for the session; it does not persist it.

**What to ignore.**

- Do not copy extension code, Shadow DOM injection, site adapters, or any prompt strings that were not readable here.
- Do not inject UI into Gmail, Slack, or LinkedIn for this school project. The assignment is a small local program, not a browser extension.
- Do not adopt Groq, Llama 3.3 70B, or their hosted proxy. The student target is local Qwen3-4B-Instruct.
- Ignore latency marketing (<200 ms, <500 ms) and the offline "heuristic engine." The rules of that fallback were not published in a source file we could read, so they cannot be reconstructed faithfully.
- Ignore the claim of open source until a `LICENSE` file is actually visible.

## Proposed adaptation for local Qwen

Recommendations only. No application code in this note. Do not special-case the bathroom sentence.

**Sampling.** Gemini used temperature 1.2 and `maxOutputTokens` 200 on Gemini 2.0 Flash. Qwen3-4B-Instruct is smaller and follows long instructions less reliably when sampling is that hot. Use a lower temperature, about 0.7, inside roughly 0.6–0.8. Keep a hard generation cap in the same neighborhood as 200 tokens (about 200–256 new tokens), because the old project cut 512 down to 200 specifically to stop long posts. Do not treat 200 as a magic constant: a 4B tokenizer can spend tokens differently, and cutting mid-hashtag is worse than one extra short sentence. The prompt should still demand the sentence count and the hashtag count so the cap is a backstop, not the only length control.

**Chat shape.** The reference stuffs the style rules and the source text into one user part and ends with `LinkedIn post:`. For Qwen3-Instruct, put the writing rules in the system message and the user's text alone in the user message. Repeat the non-negotiable rules at the end (literal metaphor, do not name the topic, sentence count, 2–3 hashtags). Small models drop constraints that appear only once in the middle.

**Rules to keep, in original wording when the prompts are written.**

- One voice per tone: proud motivational, sincere humble-brag, convicted opinion with a bold opener, warm growth story (slightly longer), bland operations update.
- Every concrete phrase must still be true about the source event.
- Never name the original topic, quote its slang, or joke about the disguise.
- 2–3 hashtags that belong to the cover story. The motivational sample uses `#Efficiency #GrowthMindset #ProductivityHacks`. Hashtags must not reveal the hidden topic.
- Corporate vocabulary is a menu (process, output, delivery, capacity, throughput, pipeline), not a checklist to dump in full.
- Unknown tone id falls back to motivational. Reject empty input before the model call.

**Rules to change for the 4B model.**

- Do not copy Gemini's `BLOCK_NONE` safety block. It is an API switch on a hosted model, not a writing rule. The local prompt should keep the output in a professional register by the metaphor rule itself.
- Do not paste the five Gemini strings in verbatim as the product prompt. Write a shorter original instruction: a shared literal-double-meaning block, plus a few lines that differ by tone. Near-duplicate 100-word prompts waste a 4B context window and are a copyright problem.
- Prefer 2–4 tight sentences when the mapping is done, even though four of the Gemini prompts say 3–5. The README's own best sample is two sentences. Padding to five sentences makes a 4B model add generic filler, which is the failure mode of "I successfully completed a personal task today."
- Inspirational can stay a sentence longer than the others, still inside the token cap, and must end with hashtags rather than getting truncated.
- Use the golden pair as an eval case: score whether volume, recency, completion, and "making room" all survive, and whether a reader without the source would still accept the post. Also score the bad paraphrase as a negative: vague category words with no mapping should fail the eval. Do not branch on that input string in code.
- Add a second eval direction inspired by tonal, if time allows: given the LinkedIn output only, a "decode" tone should recover a plain paraphrase close to the original meaning. That checks whether the metaphor was actually literal. It is a product idea, not a request to copy tonal's extension.
- If the local server emits reasoning traces, strip them before display. The user should see only the post.

**UI to rebuild originally.** Two panels, five tone chips with the ids above, Translate on button and Ctrl+Enter, examples that call translate, copy, character count, error text from the local server. Wire the swap control only if a real reverse "decode" mode exists. Otherwise omit it. Skip speech unless the demo needs it. Keep the model on localhost. Do not ship a third-party API key in the repo.
