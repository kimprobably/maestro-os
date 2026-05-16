# UX Screenshot Evidence Review

Review the screenshot evidence in `reports/ios/screenshots/manifest.json` and the referenced before/after screenshots.

Required screen keys:

- `onboarding`
- `home`
- `primary_list`
- `create_edit`
- `active_task`
- `completion`
- `history_streaks`
- `profile_settings`
- `paywall_subscription`

Compare every redesigned screen against its `before` and `after` entries. The manifest should use:

```json
{
  "screens": [
    {
      "screen_key": "home",
      "phase": "after",
      "image_path": "reports/ios/screenshots/after/home.png",
      "width": 1179,
      "height": 2556,
      "blank_score": 0.05,
      "text_clipping_risk": false,
      "redesigned": true
    }
  ]
}
```

Reject the evidence if:

- Any required screen key is missing from the after phase.
- A redesigned screen does not have both before and after screenshots.
- Any screenshot is blank or nearly blank.
- Any manifest entry has a missing image path, zero width, or zero height.
- `blank_score` is high enough to indicate an empty or unusable capture.
- `text_clipping_risk` is true.
- Text is clipped, truncated, cropped, hidden, or too small to read.
- Controls overlap, collide with text, cover important content, or are unreachable.
- Required states are missing, including empty/loading/error/success states where the screen naturally needs them.
- The `active_task` screen is not visually distinct from setup, create, or edit screens.
- The after screenshots fail to show the intended UX change clearly.
- Screenshots, manifest fields, logs, or notes expose secrets, tokens, credentials, payment details, private user data, or production customer data.

Write `.workflow/iphone-app-ux-studio/reviews/screenshot-evidence.md`.

Include a short finding list with the exact `screen_key`, phase, and image path for every rejection.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
