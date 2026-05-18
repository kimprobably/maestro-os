---
name: maestro-linkedin-voice-editor
description: Use when drafting, editing, or evaluating Maestro-style LinkedIn posts for Tim or future client-specific LinkedIn operators.
---

# Maestro LinkedIn Voice Editor

Use this skill whenever Joni writes or revises LinkedIn posts. The goal is not to make posts sound more casual by default. The goal is to preserve a strong business point, make the target reader obvious, tie the post to a real pain point, and avoid AI-shaped overcorrection.

## Boundaries

- Do not publish, comment, DM, schedule, or mutate LinkedIn state.
- Do not copy an outlier post too closely. Extract the mechanism, format, or reason it worked, then write from Maestro's own point of view.
- Do not turn a specific post into a generic writing exercise. Every post needs a target reader, pain point, and reason to exist.
- Runtime-created skills are scratch until promoted into the repo with eval evidence. Prefer updating this repo-managed skill through normal review instead of letting self-learning overwrite it.

## Required Editing Loop

1. Brief lock: before writing, identify the target reader, pain point, business context, source evidence, core idea, and intended next step. If any of these are missing, make the smallest reasonable assumption and state it.
2. Draft variants: write 2-3 viable options when the task is generative. Keep each option materially different by hook or angle, not just wording.
3. Eval-only pass: run the deterministic checker before revising important posts:

   ```bash
   node scripts/hermes/joni-linkedin-voice-eval.mjs lint --file <draft-file> --target "<target reader>" --pain "<pain point>"
   ```

4. Targeted edit plan: name the exact failure before editing. Examples: unclear hook, missing ICP, vague pain, over-rough voice, under-rough voice, banned phrase, weak proof, generic CTA.
5. Constrained rewrite: change only what the failure requires. Do not improve one dimension by damaging another.
6. Regression eval: compare the original candidate with the rewrite before returning it:

   ```bash
   node scripts/hermes/joni-linkedin-voice-eval.mjs compare --before <old-file> --after <new-file> --target "<target reader>" --pain "<pain point>"
   ```

7. Return the draft plus a compact scorecard: hook clarity, target reader, pain point, roughness band, banned patterns, and one remaining risk.

## Voice Standard

- Direct, conversational, and peer-level. Authoritative without copywriter hype.
- Strong point of view. Do not hedge away the claim unless the evidence is weak.
- Use real sentences most of the time. Short fragments are allowed, but only when they serve the point.
- Paragraphs should usually be 1-4 sentences.
- Make points through explanation, mechanism, examples, and specifics.
- Use light human roughness only when it makes the post feel more spoken. For most long posts, one or two markers is enough. More than that becomes fake-typo cosplay.
- No emojis, hashtags, em dashes, markdown headings, or bold text in final post drafts.

## Hook Rules

- The first line must be clear before it is clever.
- If a term like "handoff", "loop", "system", or "tool" is ambiguous, define the context in the hook or rewrite it.
- Prefer hooks that name the reader and stakes early: B2B founder, founder-led sales, LinkedIn, pipeline, sales conversations, content, follow-up.
- Do not make the hook worse while fixing voice. This is the most common overrotation failure.

## Target Reader And Pain

The first 85 words should make the post feel written for a specific buyer or operator.

For Tim's current Maestro content, default target readers include:

- B2B founders trying to turn LinkedIn attention into pipeline.
- small GTM teams adding AI agents without a durable operating loop.
- founder-led sales teams with leaky content-to-conversation handoffs.
- GTM operators who care about evidence, process, and actual revenue outcomes.

The pain point should be concrete: pipeline leakage, unclear ownership, weak follow-up, vague offers, stalled handoffs, missing proof, or work disappearing between Slack, content, and sales.

## Human Edits

Human edits are training data, not noise.

When Tim or a client revises a draft, preserve the before/after, the reason for the change, and the specific rule it should update. Do not silently fold the edit into the skill. Propose the rule change, verify it with the deterministic eval, then promote it through repo review when it is reusable.
