# Competitor Research

Read `.workflow/iphone-app-factory/context.md`, `quality-bar.json`, and any research artifacts already available.

Find up to `{{ inputs.max_competitors|default("12") }}` competitor iPhone apps. For each:

- positioning and primary promise
- onboarding shape
- monetization
- main features
- retention mechanics
- visible reviews/complaints
- likely growth channel or social wedge
- gaps we can exploit

Write `.workflow/iphone-app-factory/research/competitors.md`.

Secret handling is blocking: never print environment variables or credential values. If checking credential availability, report only true/false presence and never echo, grep, dump, log, or write the value. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Be explicit about evidence quality. Do not overfit to the largest apps if smaller fast-growing products better match the opportunity.

Keep the pass bounded: write the report once, do not run ad hoc verification loops, and end after the file is written. Do not write implementation code.
