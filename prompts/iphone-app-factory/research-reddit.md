# Reddit Pain Mining

Read `.workflow/iphone-app-factory/context.md` and `quality-bar.json`.

Research Reddit conversations related to `{{ inputs.app_type|default("consumer life-improvement app") }}`. Look for:

- painful jobs-to-be-done
- workarounds people describe
- apps people recommend or complain about
- language users use to describe the problem
- feature requests and distrust/privacy concerns

Use live data when available through Apify, Firecrawl, or web search. If unavailable, mark evidence as limited and do not fabricate quotes.

Secret handling is blocking: never print environment variables or credential values. To check whether `APIFY_TOKEN` or another credential exists, use a boolean/presence-only command such as `node -e "console.log(Boolean(process.env.APIFY_TOKEN))"` and never echo, grep, dump, log, or write the value.

Write `.workflow/iphone-app-factory/research/reddit.md` with source links, summarized themes, and a ranked opportunity list.
