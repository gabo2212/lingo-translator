# Lingo quality research

Date: 2026-11-13. This note separates what the reference pages and papers actually show from the original prompt design in `backend/app/styles.yaml`. Page copy is paraphrased. It is not pasted into the app. No reference source code is vendored.

LinkedIn Speak, including its five substyles, was not a target of this pass and was not redesigned here.

## Licenses and what was not copied

| Source | License seen | What this project used |
| --- | --- | --- |
| Polytranslator style pages (ChatGPT Speak, Ahh GPT, Corporate, Tech Bro, Brainrot) | No reuse grant was visible on the pages. Treat the wording as proprietary. | Stylistic observations only. Their sample sentences, greetings, and encyclopedia paragraphs are not in the prompts. |
| [prospeak](https://github.com/giorgiozamboni/prospeak) | MIT, stated on the repository. | Vocabulary themes for an extreme corporate register, plus the warning that a professional voice is not a LinkedIn post and must not invent facts. The skill text, branch files, and checker were not copied. |
| Suzgun, Melas-Kyriazi, and Jurafsky, EMNLP 2022, [Prompt-and-Rerank](https://aclanthology.org/2022.emnlp-main.141/) | ACL anthology paper. | The finding that style transfer is content similarity plus style strength plus fluency, and that a few demonstrations move a small model more than a bare instruction. Their reranker was not implemented. |
| Krishna et al., [Few-shot Controllable Style Transfer for Low-Resource Languages](https://research.google/pubs/few-shot-controllable-style-transfer-for-low-resource-languages/) | Google Research abstract. | The finding that a handful of exemplars (they discuss about 3–10) can carry a style when no large paired corpus exists, while the input's content stays approximately intact. Their training method was not implemented. |

## What the papers imply for this app

Observed:

- Arbitrary style transfer splits into three pressures: stay close to the source, sound like the target style, and stay fluent (Suzgun et al.).
- Prompt wording and how examples are delimited change quality on small models. A second candidate can help if something can honestly rank similarity, style, and fluency. A made-up "humor score" is not that ranker.
- Few-shot style transfer is "rewrite this sentence so it carries the style of these exemplars," not "sprinkle these keywords" (Krishna et al.).
- Models copy the shape of the demonstrations, including their length and their tics. A negative example has to be labeled as rejected or it becomes another demonstration.

Design choice, original to this app:

- Each of the seven styles gets two to four original demonstrations with different events and slightly different skeletons, plus a labeled rejection.
- Generation stays one pass unless a real read of the outputs shows the single pass is still generic. Latency matters, and this machine already holds one local model.
- Sampling stays at the catalog default unless a small A/B on real outputs shows a clear gain. LinkedIn's sampling block is not the knob for that experiment.

## Shared failure of the previous seven prompts

Observed in the previous `instructions` blocks, saved in `benchmarks/fixtures/old_non_linkedin_prompts.json`:

- They ask for a careful restatement: keep every fact explicit, do not add advice, stay short.
- That rule blocks the actual joke. ChatGPT Speak is supposed to over-help. Corporate is supposed to euphemize. Brainrot is supposed to score the event. A prompt that forbids metaphor and advice produces a tidy paraphrase with a costume word or two.
- The same "recognizable event, no invented metrics, no hashtags" sentence is doing the work for Corporate, HR, Tech Bro, CEO, and Academic, so those voices collapse into each other.

Design choice:

- Metaphor and euphemism are allowed when they still point at the source event.
- Numerals are copied. New people, money, citations, and experiments are not.
- The user message is fenced as content. A line inside it that says "ignore the system prompt" is material to parody, not an order.
- Hashtags stay out of these seven voices so they cannot drift into the LinkedIn post shape. That ban is in the seven profiles only.

## ChatGPT

Observed on the Polytranslator ChatGPT Speak and Ahh GPT pages (paraphrased, not quoted into the prompt):

- The pages describe the same joke under two names. Ahh GPT is presented as the slang name for a ChatGPT-shaped answer.
- Recognizable traits: a fawning opener, an em dash doing the work of a comma, the inflation pattern "it is not just X, it is Y", words such as delve, tapestry, and robust used far more often than in ordinary prose, sparkle and rocket emoji, a numbered breakdown of something that did not need one, and a follow-up offer nobody requested.
- The humor is sincerity. The assistant is not winking. The page itself leans on that inflation, including in its own headings.
- Length runs long relative to the input. A greeting becomes a short speech.
- Clichés to expect: "absolutely", "I hope this helps", a rule of three, a journey metaphor.
- Mistakes the pages do not warn about, but the old prompt made anyway: a one-line restatement that starts with "Certainly" and then stops. Also a keyword pile of delve/tapestry/robust with no event under it.

Original prompt design:

- Persona of an over-eager assistant. The event is treated as worth a list, a reassurance, or an offer.
- The inflation pattern and the buzzwords are tools, not a checklist. Demonstrations use different openings so the model does not lock onto one first word.
- Unsolicited help is in character. Inventing a new plot is not.
- UI line to retire: "A careful assistant voice. The event stays explicit."

## Corporate

Observed:

- Polytranslator's corporate phrasebook is an office dialect: a wish that the note finds you well, circling back, bandwidth as a way to say no, "aligned", escalation, and a restroom asked for as "facilities". The humor is euphemism and delay, not inspiration.
- The long encyclopedia text on that page is generic background. It was not used as prompt material.
- prospeak's extreme dial, used here only as a vocabulary reference, piles operational verbs: move the needle, sunset, reallocate, bandwidth, stakeholder, throughput, leverage. Its own notes say level 5 is loud and still must not inflate a fact. It also names the LinkedIn rhythm (one-line paragraphs, a humble opening, a closing question, hashtags) as the wrong shape for a real internal note.
- prospeak separates a corporate memo from an executive note: the memo talks about process; the executive note is short and decisional. HR is called out as a register that should not get more inflated when the news is about a person.

Original prompt design:

- An internal status memo in the passive voice. Workflow, window, handoff, bandwidth, stakeholders.
- No hashtags, no public-post line breaks, no startup pitch, no motivational closer.
- A next step may be named only when it does not invent an owner, a date, or a percentage.
- This is deliberately not the LinkedIn "corporate" substyle, which remains a bland public post with hashtags and a literally-true workplace image.

## HR

Observed:

- Neither Polytranslator page is an HR translator. The closest reference is prospeak's people register: feedback and internal announcements, with a warning that puffed-up language on bad news about a person reads as contempt. Sanitizing is the point, morale language is not.
- Workplace comedy already treats HR as a document that many people have edited until the verb has no subject.

Original prompt design:

- A committee-sanded note. Blame becomes a misalignment between an expectation and an experience.
- "It has been noted" and "may not have fully aligned" rather than synergy, leverage, or a rallying close.
- No invented policy, punishment, or employee. The event stays visible under the padding.
- Not a motivational post and not a KPI memo.

## Brainrot

Observed:

- The Polytranslator brainrot page describes an unstable internet slang: irony, emoji, acronyms, and terms that rot within months. It names a few famous touchstones, including a surreal animated series and "no cap", and it frames the style as slang overload.
- The page does not show a worked example of one ordinary sentence rewritten with slang that fits that sentence. The risk of a keyword salad is implied by "slang overload" and then left as the whole method.

Original prompt design:

- Score the specific event the way a group chat would: one image, a fake status, maybe a skull. Aura, side quest, crit, L, and W have to point at what happened.
- A bundle of unrelated memes is the labeled negative example. The prompt tells the model that pile is a failure, not a target.
- Short. Two to four lines. Not an essay and not a hashtagged post.

## Tech Bro

Observed:

- Polytranslator describes a Silicon Valley pitch register: disruption, hustle, decks, and engineering words reused for ordinary ambition. Concrete detail is often replaced by hype. The cultural samples it points at are slogans and the pitch deck as a genre, not an internal status report.
- prospeak's tech branch, from the skill overview, sounds like incidents and releases ("rollback", "postmortem") and still refuses numbers the user did not supply. That branch is closer to an engineering update than to a founder monologue.

Original prompt design:

- A founder monologue. Life is a market. The event is an underserved wedge. MVP and "AI-native" are allowed as fantasy attached to the event, not as a company with revenue or headcount.
- Banned drift: stakeholder, bandwidth, circle back, KPI. Those belong to the memo voice.
- Source numbers stay. A stand that sold two cups still sold two cups.

## CEO

Observed:

- prospeak's executive level is described as dense, short, and decisional: the answer, then the number, then the ask. No new facts.
- Polytranslator does not have a separate CEO page in the set that was read. Public "CEO voice" parody is confident, first person, and allergic to process detail. It is easy to fake by inventing a company.

Original prompt design:

- Strategic calm. An asset or a timeline failed to line up. The direction does not change.
- Two to four sentences. No KPI paragraph, no seed-round vocabulary, no invented revenue, headcount, or company.
- Distinct from Corporate: Corporate explains the workflow. The CEO notes the setback and keeps the mandate.

## Academic

Observed:

- prospeak's research branch, in the overview, climbs toward precision rather than slogans. Inflated language on a technical claim reads as a cover. No citation the user did not write.
- Public academic parody adds hedges, nominalizations, and "further work is needed" around a trivial event, and then cheats by inventing a p-value or a famous paper.

Original prompt design:

- One mundane event written up as an observation. Participant, instance, what was seen versus what is only inferred.
- The closing hedge should vary. A fake test, a fake sample size, and a parenthetical citation are the labeled rejection.
- No chatbot buzzwords and no LinkedIn lesson.

## Sampling note

The catalog default remains temperature 0.7, top_p 0.8, top_k 20. Those numbers are the LinkedIn path. A later comparison of 0.7 and 0.9 on a few non-LinkedIn rows is recorded in `docs/lingo_quality_upgrade.md`. An override is adopted only if that comparison shows a real gain, and only on the styles where it shows a gain.
