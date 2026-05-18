# Model Routing

## OpenRouter coding test set

Source of truth for live model metadata is OpenRouter's `/api/v1/models` endpoint. These entries were refreshed on 2026-05-13/14 and are defined in `.fabro/project.toml` using upstream Fabro's configurable `openai_compatible` provider support.

| Role | Model ID | Alias | Context | Max Output | Input / Output $ per MTok | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Cheap control | `anthropic/claude-haiku-4-5` | `openrouter-haiku` | 200000 | 64000 | 1.00 / 5.00 | Local Fabro ID maps to OpenRouter API ID `anthropic/claude-haiku-4.5` |
| Kimi coding | `moonshotai/kimi-k2.6` | `openrouter-kimi` | 262142 | 262142 | 0.74 / 3.50 | Vision, tools, reasoning, reasoning effort |
| Fast Gemini | `google/gemini-3.1-flash-lite` | `openrouter-gemini-flash-lite` | 1048576 | 65536 | 0.25 / 1.50 | Multimodal, tools, reasoning |
| Gemini review | `google/gemini-3.1-pro-preview` | `openrouter-gemini-pro` | 1048576 | 65536 | 2.00 / 12.00 | Multimodal, tools, reasoning |
| Qwen coding | `qwen/qwen3.6-plus` | `openrouter-qwen-plus` | 1000000 | 65536 | 0.325 / 1.95 | Multimodal, tools, reasoning |
| DeepSeek heavy | `deepseek/deepseek-v4-pro` | `openrouter-deepseek-v4-pro` | 1048576 | 384000 | 0.435 / 0.87 | Tools, reasoning |
| DeepSeek fast | `deepseek/deepseek-v4-flash` | `openrouter-deepseek-v4-flash` | 1048576 | 131072 | 0.126 / 0.252 | Tools, reasoning |

## Routing defaults

- Cheap control, smoke checks, and deterministic glue: `openrouter-haiku`.
- File-writing agents today: Claude CLI and Codex CLI. These run inside the
  repo/sandbox, can use local skills, and can execute verification commands.
- OpenRouter code-writing candidate path: proposal-only first. A model returns
  structured JSON with a unified diff, then a local applicator applies it in a
  sandbox and runs deterministic checks. Do not let OpenRouter models write
  directly to the workspace until they pass this eval loop.
- Expensive scaffolding and hard review: Kimi K2.6, Gemini Pro, DeepSeek Pro,
  and Claude/Codex high-effort CLI runs. Use these when the task needs
  architecture synthesis, spec ambiguity detection, migration reasoning, or
  security review.
- Cheap/balanced generation: Qwen Plus and DeepSeek Flash for bounded code
  generation, patch proposals, fixture creation, and first-pass review fanout.
- Keep model routing in Fabro `model_stylesheet` blocks explicit. Do not rely
  on provider defaults for production workflows.

## Execution Environments

| Environment | Writes files? | Best models | Use for | Promotion gate |
| --- | --- | --- | --- | --- |
| Claude CLI sandbox | Yes | Claude Sonnet high/xhigh | spec drafting, architecture, implementation, simplification, difficult fixes | native checks + reviewer gates |
| Codex CLI sandbox | Yes | Codex high/xhigh for coding, medium for routine edits | repo-native code edits, tests, refactors, review-fix loops | native checks + code review |
| OpenRouter reviewer | No | DeepSeek Pro, Qwen Plus, Gemini Pro, Kimi | structured reviews, risk scans, consensus, ADR critique | JSON validity + verdict gate |
| OpenRouter patch proposal | No direct write | Qwen Plus, DeepSeek Flash, Kimi, DeepSeek Pro | cheap code generation and alternative implementations | patch applies in sandbox + tests pass |
| OpenRouter scaffold proposal | No direct write | Kimi, Gemini Pro, DeepSeek Pro | app skeleton plans, framework choices, work package alternatives | human/spec review + deterministic contract checks |

## Claude and Codex Effort Levels

- Use low/medium effort for deterministic glue, summarization, and small docs.
- Use high effort for normal implementation, test writing, and code review.
- Use xhigh/max effort for architecture decisions, broad refactors, migration
  plans, security-sensitive work, and unresolved reviewer conflicts.
- Prefer Codex for codebase-native patch work when the task is tightly scoped
  and testable. Prefer Claude CLI for long-form spec/architecture synthesis and
  UI/product-heavy implementation until Codex has equivalent local context.

## Model Evaluation Process

Run the same small task suite across candidate OpenRouter models before routing
real factory work to them:

1. `spec_review`: review the active factory spec for ambiguity and missing
   gates.
2. `patch_proposal`: return a JSON-wrapped unified diff for a small TypeScript
   bug.
3. `architecture_risk`: critique the generated architecture and recommend
   routing.

Dry run:

```sh
npm run model:evaluate
```

Live run:

```sh
npm run model:evaluate -- --live
```

The report is written to `.workflow/model-evals/openrouter-coding-eval.json`.
Promotion rule: a model needs average score >= `0.80`, no JSON failures, and
patch proposals that apply cleanly in a sandbox before it graduates from
review/proposal mode to any code-generation workflow.

Initial expectations:

- Kimi K2.6: candidate for scaffolding and larger patch proposals.
- Qwen Plus: balanced candidate for cheap generation and review fanout.
- DeepSeek Pro: candidate for difficult review, security, and bug reasoning.
- DeepSeek Flash: candidate for fast cheap patch proposals and smoke reviews.

## Provisional OpenRouter Eval Results

Date: 2026-05-13.

Harness: `scripts/evaluate-openrouter-models.mjs`, also wrapped by
`workflows/fabro/openrouter-coding-eval.fabro`.

First live pass:

| Model | Passed | Average Score | Approx Cost | Notes |
| --- | ---: | ---: | ---: | --- |
| `qwen/qwen3.6-plus` | 3/3 | 0.93 | ~$0.0193 | Best first-pass structured reviewer/proposer. |
| `deepseek/deepseek-v4-flash` | 2/3 | 0.63 | ~$0.0023 | Good cheap patch/architecture candidate. |
| `deepseek/deepseek-v4-pro` | 2/3 | 0.60 | ~$0.0059 | Useful for risk/security style review. |
| `moonshotai/kimi-k2.6` | 0/3 | 0.00 | ~$0.0195 | Did not produce usable parsed JSON in this harness. |

Second pass with stricter JSON response format and 45s timeout:

| Model | Passed | Average Score | Notes |
| --- | ---: | ---: | --- |
| `deepseek/deepseek-v4-pro` | 2/3 | 0.63 | Patch and architecture passed; spec review failed. |
| `deepseek/deepseek-v4-flash` | 2/3 | 0.60 | Patch and architecture passed; spec review failed. |
| `qwen/qwen3.6-plus` | 1/3 | 0.33 | Volatile under timeout/response-format settings. |
| `moonshotai/kimi-k2.6` | 0/3 | 0.00 | Not promoted without prompt/model-ID investigation. |

Immediate routing decision:

- Keep Claude/Codex CLI as the only direct file-writing agents.
- Use Qwen Plus and DeepSeek Flash as patch proposal/review candidates, not
  direct writers.
- Use DeepSeek Pro for higher-risk review fanout after it passes repeated JSON
  stability tests.
- Do not route production work to Kimi in this harness yet.

## Validation

Run:

```sh
fabro run workflows/fabro/openrouter-model-smoke.toml --no-upgrade-check
```

The smoke workflow checks that the local Fabro server lists the curated OpenRouter set and tests each curated model by explicit model ID. Upstream main supports custom providers in the catalog, but the current CLI provider filter still validates against built-in provider IDs, so use `--query` or explicit `--model` for OpenRouter checks.
