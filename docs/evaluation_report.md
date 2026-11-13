# Evaluation report

The measurements in this file are for `Qwen/Qwen3-4B-Instruct-2507`. The API now loads `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`. That swap, and the CUDA check that followed it, is in `docs/model_swap.md`. The numbers below were not re-run on the abliterated weights.

Measured on this PC on 13 November 2026. Nothing below is copied from an Arch machine or from an RTX 4080.

Hardware: Windows 11 Pro, AMD Ryzen 9 7900X3D, 31.1 GiB system RAM, NVIDIA GeForce RTX 5080, `nvidia-smi` memory.total **16303 MiB**, driver 617.42, CUDA UMD 13.4, compute capability 12.0. System RAM is not VRAM.

Software: project venv Python 3.12.10, `torch 2.15.0+cu134` from `https://download.pytorch.org/whl/cu134`, `transformers 5.23.0`. `torch.cuda.get_arch_list()` included `sm_120`. A 2×2 BF16 matmul on the GPU returned `[[2.0, 2.0], [2.0, 2.0]]`.

Model: `Qwen/Qwen3-4B-Instruct-2507`, BF16, resident on `cuda:0`. After load, `torch.cuda.memory_allocated` was **7672.3 MiB**. No 4-bit quantization. No cloud API.

Human rubric fields `meaning`, `style_fidelity`, and `metaphorical_humor` are **null** in every result file. They were not filled in. The choice of prompt and temperature below is from reading the saved text and from the automatic digit check.

## Smoke generation

`scripts/smoke_cuda.py`, seed 13, temperature 0.7, top_p 0.8, top_k 20, `max_new_tokens` 180, LinkedIn motivational, prompt `linkedin.motivational.D.r1`.

Source: `I took a massive dump just now`

Output:

> I just completed a large-scale system purge at the end of the cycle.
> All data streams were cleared and the system returned to baseline integrity.
> #SystemStability #OperationalClosure #DataIntegrity

First-call latency **47457 ms** (this process also paid for the first CUDA kernels). Peak memory **7821.1 MiB**. The same sentence, same seed, in the later dev run (process already warm) took **2.784 s** and produced the same paragraph. `load_count` stayed 1 inside each process.

## Tests that were actually run

```text
.\.venv\Scripts\python.exe -m pytest -m "not gpu" -q
38 passed, 1 deselected in 1.20s
```

The last unit-test run was after the prompt file was restored to revision r1, with the ChatGPT anti-echo line kept. An earlier run, before that edit, was also 38 passed.

```text
.\.venv\Scripts\python.exe -m pytest -m gpu -q -s
1 passed, 38 deselected in 23.21s
```

The GPU test loaded the model once (`load_count` did not increase on the second `load()` or the second `translate()`), required CUDA, and both calls returned non-empty text. At that moment the ChatGPT prompt did not yet have the "Certainly." line, `max_new_tokens` was 32, and both calls returned only:

> I burned the rice.

That echo is a real failure of the short ChatGPT prompt. The line that forces a "Certainly." opener was added after this test. The later spot check is the measurement of the edited prompt. The GPU test was not run a second time.

## Prompt variants

Eight dev sentences, LinkedIn motivational, seed 13, temperature 0.7, top_p 0.8, top_k 20, `max_new_tokens` 180. File: `benchmarks/results/dev_variants.json`. 32 generations, 0 errors.

| Variant | Mean latency | Median latency | Digit retention on the 4 sentences that contain digits | Rows that lost a digit |
| --- | --- | --- | --- | --- |
| A basic paraphrase | 3.188 s | 3.367 s | 1.0 | 0 |
| B behavior, no demos | 5.444 s | 5.059 s | 0.5 | 2 |
| C metaphor rules, no demos | 5.722 s | 5.153 s | 0.75 | 1 |
| D rules plus original demos | 3.355 s | 3.296 s | 1.0 | 0 |

Mean peak memory across the 32 calls: **7761.2 MiB**.

**D is the production prompt.** A and D were the only variants that kept every digit. A is not the product: on the bathroom sentence it wrote "I had a significant bowel movement a moment ago" and tagged `#BowelHealth`. That names the topic. On the toast sentence it used `#ToastFail`. B refused the bathroom sentence ("No further commentary.") and, on the lecture sentence, claimed the intended focus was maintained. B also wrote `12` as "twelve" and dropped `90`. C produced a purge metaphor but invented the clock time **14:37**, which is not in the source, and also wrote `12` as "twelve".

D on the bathroom sentence is the smoke paragraph above. It does not name the act. It does not invent a clock time. On the numbered sentences it kept `12`, `$47`, `11:40`, and `90`.

D is not clean on style. On the toast sentence it still named "toast" and "smoke alarm", and it said the toast was "undercooked and overcooked simultaneously", which contradicts "burned". On the fish sentence it named "fish" and "office microwave" while keeping `11:40`. The digit metric cannot see those failures. That is why the metric is not a humor score.

## Temperature

Variant D, first four dev sentences, seed 13. Temperatures 0.9 and 1.1 were generated fresh. The 0.7 rows are the variant D rows from the table above. File: `benchmarks/results/dev_temperature.json`.

Digit retention on that slice was **1.0 at 0.7, 0.9, and 1.1**. Mean latency was 3.332 s, 3.279 s, and 3.412 s. The digit score does not separate them.

The text does. At **1.1** the bathroom sentence came back with an invented **"11:47 p.m."** At **0.9** the toast sentence was again "undercooked and overcooked" and named the kitchen. **0.7** is the shipped default because it did not add a fake clock time on the bathroom sentence, and raising the temperature did not fix the toast contradiction.

Gemini's 1.2 was not used.

## Rejected rewrite of the prompt (r2)

`benchmarks/results/dev_refined.json` is a second pass over the same 8 dev sentences after extra bans were added (do not name the everyday noun, do not invent a clock, burned is not under-done). Seed 13, temperature 0.7. Mean latency 3.859 s. Digit retention on the 4 numbered sentences was still 1.0. Peak mean **7848.4 MiB**.

The golden sentence got worse. r2 invented **"3:17 p.m."** The half-page report became **"one page"**, and the model invented a follow-up task. Toast was still named. The extra rules were removed. The shipped LinkedIn system text matches `system_prompts.D` inside `dev_variants.json` (checked by comparing the strings). The ChatGPT style kept one added line, because the GPU test had echoed the user sentence: the answer must start with "Certainly." and must not be only a copy.

## Other styles

`benchmarks/results/final_styles.json`. Same seed, temperature 0.7, production prompts. Three sentences for ChatGPT, corporate, HR, and brainrot (`I burned the rice.`, the mistaken wave, the Q3 budget at 4:15). Two sentences for the other LinkedIn tones. One sentence (`The bus left.`) for tech bro, CEO, and academic.

ChatGPT, after the edit:

> Certainly. You burned the rice.

> Certainly. You sent the Q3 budget at 4:15 p.m. but omitted the spreadsheet attachment.

The voice is recognizable and `4:15` survived. It is a light paraphrase, not a clever one. Mean latency on the three calls was 4.792 s, pulled up by an 11.916 s first call. The other two were 1.204 s and 1.256 s. Digit retention on the one numbered sentence was 1.0.

Corporate kept the burned rice and the 4:15 budget, and it invented a next step ("assign a new owner", "follow up with the finance team") that the source does not contain. HR did the same kind of invention ("I'll take steps", "I've since followed up"). Brainrot stayed short and understandable ("My rice was a fire.", "Sent the Q3 budget at 4:15 p.m. forgot the spreadsheet part.") and was fast (mean 0.817 s). It is not a rich slang rewrite.

Humble brag, thought leader, and LinkedIn corporate on the sock drawer and the three alarms did keep "eleven" and "three" and used the right stance (gratitude, "Unpopular opinion:", operations words). Inspirational said the drawer held "eleven pairs" that had no match. The source says eleven single socks, not eleven pairs. Thought leader on the alarms was closer: three alarms, none answered.

Optional styles on `The bus left.`:

- Tech bro invented a product shipment: "We're on our way to ship the next version."
- CEO invented a time and a place: "We'll regroup at the central hub by 1400."
- Academic stayed literal: "A bus departed."

## Held-out test set

`benchmarks/results/final_testset.json`. 32 sentences, none of them the bathroom sentence. LinkedIn motivational, variant D, revision r1, seed 13, temperature 0.7. 0 generation errors.

| Measure | Value |
| --- | --- |
| Mean latency | 4.190 s |
| Median latency | 3.976 s |
| Max latency | 7.596 s |
| Mean peak memory | 7825.0 MiB |
| Mean digit retention, all 32 rows | 0.922 |
| Sentences that contain a digit | 13 |
| Mean digit retention on those 13 | 0.808 |
| Numbered sentences that lost at least one digit | 3 |

The 0.922 figure counts a sentence with no digits as a perfect 1. The 0.808 figure does not. Ten of the 13 numbered sentences kept every digit. The three misses:

1. `I walked the dog around the block and it rained for 5 minutes.` The `5` became "five-minute". Meaning is close. The digit is gone.
2. `I booked the conference room for 8 people and 11 showed up.` Both digits became words ("eight", "eleven"). The counts are right and the digits are not.
3. `I owed Maya $18 and paid her back $20 by mistake.` The model kept `$20`, dropped `18`, and wrote "exceeding the original obligation by $2". It did the subtraction instead of copying both numerals, and it invented a later reconciliation.

A long sentence did keep its digits. Source: woke at 6:05, missed the 7:10 train, arrived at 8:20. The output still contains `6:05`, `7:10`, and `8:20`.

`I burned the rice.` on this LinkedIn run:

> The batch of rice failed to reach the required doneness and was discarded during the initial quality check.
> No further use was made of the affected portion.
> #ProcessIntegrity #FailSafe #QualityControl

"Discarded" and "quality check" are not in the source. The burn is still there as a failed doneness. Compared with ChatGPT's "Certainly. You burned the rice." on the same input, the style change is visible.

## What was not measured

No human 1–5 scores. No BLEU. A good metaphor shares few words with the source, so n-gram overlap would punish the joke. No second-pass rewrite: `second_pass.enabled` is false, and the r2 prompt edit was a manual change, not that flag.
