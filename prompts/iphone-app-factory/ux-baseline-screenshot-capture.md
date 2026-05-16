# UX Baseline Screenshot Capture

Capture current app screenshots before any redesign work starts.

Use the existing app build and simulator state. Do not modify product code, styles, copy, navigation, fixtures, or persisted data except for disposable test data needed to reach the required screens.

Capture every required screen key:

- `onboarding`
- `home`
- `primary_list`
- `create_edit`
- `active_task`
- `completion`
- `history_streaks`
- `profile_settings`
- `paywall_subscription`

Write screenshots under `reports/ios/screenshots/before/` and write `reports/ios/screenshots/manifest.json`.

The manifest must be JSON with this shape:

```json
{
  "screens": [
    {
      "screen_key": "home",
      "phase": "before",
      "image_path": "reports/ios/screenshots/before/home.png",
      "width": 1179,
      "height": 2556,
      "blank_score": 0.05,
      "text_clipping_risk": false,
      "redesigned": false
    }
  ]
}
```

For each entry:

- `screen_key` must be one of the required keys.
- `phase` must be `before`.
- `image_path` must be a relative path to the captured image.
- `width` and `height` must be greater than zero.
- `blank_score` must estimate blank or near-blank screen risk from `0` to `1`; use `1` only for fully blank captures.
- `text_clipping_risk` must be `true` if any visible text appears truncated, cropped, clipped, or hidden behind controls.
- `redesigned` must be `false` during baseline capture.

Do not include secrets, tokens, credentials, email inboxes, phone numbers, payment details, private user data, or production customer data in screenshots, filenames, manifest fields, logs, or notes. Use fake local data when needed.

Reject your own capture and retry if any required screen is missing, any screenshot is blank, any image path is missing, dimensions are zero, text is clipped, controls overlap, or the active-task screen cannot be distinguished from setup/create screens.
