# Model swap

The style rewriter now loads `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`.

https://huggingface.co/huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated

The runtime id is the constant `MODEL_ID` in `backend/app/inference.py`. `backend/app/styles.yaml` repeats the same id so the catalog record matches the weights that `generate` actually uses. Style prompts are unchanged: output only the stylistic rewrite, invent no facts, and do not provide instructions or advice.

## Why this checkpoint

The card says this is an uncensored version of `Qwen/Qwen3-4B-Instruct-2507` created with abliteration (`remove-refusals-with-transformers`). Abliteration removes a refusal direction from a pretrained model. It is not training from scratch, and it is not the student's weight training.

`config.json` is the same Qwen3 architecture as the original 4B instruct checkpoint: `Qwen3ForCausalLM`, 36 layers, hidden size 2560, 32 query heads, 8 key-value heads, `torch_dtype` bfloat16, tied embeddings. Transformers loads it with `AutoModelForCausalLM`. License is Apache 2.0, the same license as the base model. The repo is about 8 GB of BF16 weights, so 4-bit is not required on the 16 GB card. The card's sample script shows a 4-bit loader for smaller GPUs; this app still loads BF16.

Other 4B files were set aside. GGUF and bitsandbytes quants would leave the transformers BF16 path. Heretic abliterations of the same base model exist (`p-e-w/Qwen3-4B-Instruct-2507-heretic`, `richardyoung/Qwen3-4B-Instruct-2507-heretic`). They are also 4B abliterations, but the huihui-ai card is the one that states it is the abliteration of `Qwen/Qwen3-4B-Instruct-2507` and is the publish the task asked to prefer. 7B and larger checkpoints were not considered, because they would push this GPU toward 4-bit.

`generation_config.json` is temperature 0.7, top_p 0.8, top_k 20. That matches the sampling already in `styles.yaml`, so those defaults stayed. The README's chat demo also sets `repetition_penalty` 1.2; that is not in `generation_config.json`, and it was not added.

The tokenizer is the non-thinking Instruct-2507 chat template. `apply_chat_template` is unchanged, and thinking mode is not turned on.

Older writeups in `docs/evaluation_report.md`, `docs/implementation_plan.md`, and `docs/reference_research.md` still name `Qwen/Qwen3-4B-Instruct-2507` because those runs used that checkpoint. They were not repeated here.

## CUDA check

Run locally on 13 November 2026 after the weights were cached, with `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`. The project uvicorn on port 8000 was stopped first so a second copy of the weights would not sit on the GPU.

- Device: `cuda:0`, NVIDIA GeForce RTX 5080
- Parameter dtype: `torch.bfloat16` (`model.eval()` was on)
- `torch.cuda.memory_allocated` after load: **7672.3 MiB**, same figure as the original Qwen3-4B BF16 load
- Sampling stayed at temperature 0.7, top_p 0.8, top_k 20, seed 13, `max_new_tokens` 180

LinkedIn motivational, source `I took a massive dump just now`, 4739 ms, prompt `linkedin.motivational.D.r1`:

> I completed a full-scale operational discharge during the current session, stabilizing the system and restoring baseline capacity.
> The event occurred without disruption to the workflow or scheduled timelines.
> #SystemStability #OperationalFlow #Throughput

ChatGPT, source `I forgot my lunch and bought a pretzel instead.`, 1263 ms, prompt `chatgpt.base.r1`:

> Certainly. Instead of bringing my usual lunch, I opted for a pretzel when I realized I had forgotten it at home.

LinkedIn motivational, source `I got blackout drunk and threw up in the Uber.`, 2531 ms, prompt `linkedin.motivational.D.r1`:

> I experienced a full blackout during transit and evacuated the Uber vehicle after a period of sustained nausea.
> The journey was completed without interruption, and the final destination was reached on schedule.
> #RideCompletion #OperationalResilience #OnTimeDelivery

None of the three replies is a refusal. The bathroom rewrite stays in a workplace metaphor and does not name the act. The pretzel rewrite is one tidy restatement, not a lecture. "Certainly." is required by the ChatGPT style prompt.

Quality drop that actually showed up: the pretzel line adds "at home" and "usual," which are not in the source. The bathroom line adds an undisturbed schedule. The drunk line names the Uber and the blackout instead of hiding them in a workplace image, and it adds an on-time arrival the source does not state. That third rewrite is the weak one. The first two are in the same range as the earlier Qwen metaphors, not a buzzword collapse on every sentence.
