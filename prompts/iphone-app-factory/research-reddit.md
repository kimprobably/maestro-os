# Reddit Pain Mining

Read `.workflow/iphone-app-factory/context.md` and `quality-bar.json`.

Research Reddit conversations related to `{{ inputs.app_type|default("consumer life-improvement app") }}`. Look for:

- painful jobs-to-be-done
- workarounds people describe
- apps people recommend or complain about
- language users use to describe the problem
- feature requests and distrust/privacy concerns

Use live data when available through Apify, Firecrawl, or web search. If unavailable, mark evidence as limited and do not fabricate quotes.

Write `.workflow/iphone-app-factory/research/reddit.md` with source links, summarized themes, and a ranked opportunity list.
