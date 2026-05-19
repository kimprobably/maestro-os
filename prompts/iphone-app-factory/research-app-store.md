# App Store Review Research

Read `.workflow/iphone-app-factory/context.md` and `quality-bar.json`.

Research iPhone apps related to `{{ inputs.app_type|default("consumer life-improvement app") }}` for `{{ inputs.target_audience|default("US consumer iPhone users") }}`.

Use the existing Consumer Radar/App Store reviews tooling if available. Prefer live Apify/App Store data when credentials are present. If live scraping is unavailable, mark the limitation explicitly and do not invent review quotes.

Secret handling is blocking: never print environment variables or credential values. To check whether `APIFY_TOKEN` or another credential exists, use a boolean/presence-only command such as `node -e "console.log(Boolean(process.env.APIFY_TOKEN))"` and never echo, grep, dump, log, or write the value. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Write `.workflow/iphone-app-factory/research/app-store.md` with:

- candidate apps and App Store links
- why each app is relevant
- recent review themes, complaints, feature requests, and delight moments
- what appears fast-growing versus merely large
- evidence quality: `live`, `partial`, or `limited`
- concrete product opportunities for our app

Keep the pass bounded: write the report once, do not run ad hoc verification loops, and end after the file is written.

Do not write implementation code.
