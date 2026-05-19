# Reddit Pain Mining

Read `.workflow/iphone-app-factory/context.md` and `quality-bar.json`.

Research Reddit conversations related to `{{ inputs.app_type|default("consumer life-improvement app") }}`. Look for:

- painful jobs-to-be-done
- workarounds people describe
- apps people recommend or complain about
- language users use to describe the problem
- feature requests and distrust/privacy concerns

Use live data when available through Apify, Firecrawl, or web search. If unavailable, mark evidence as limited and do not fabricate quotes.

Secret handling is blocking: never print environment variables or credential values. To check whether `APIFY_TOKEN` or another credential exists, use a boolean/presence-only command such as `node -e "console.log(Boolean(process.env.APIFY_TOKEN))"` and never echo, grep, dump, log, or write the value. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Do not spawn subagents, delegate, inspect `.env` files, or search the environment for credentials. Try at most one live-source approach; after any network or TLS failure, record the attempted public URLs, mark evidence as limited, and continue without more probing.

Write `.workflow/iphone-app-factory/research/reddit.md` with source links, summarized themes, and a ranked opportunity list.

Keep the pass bounded: write the report once, do not run ad hoc verification loops, and end after the file is written. Do not write implementation code.
