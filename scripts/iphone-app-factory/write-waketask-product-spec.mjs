#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";

const outputDir = ".workflow/waketask-product-iteration";
const markdownPath = `${outputDir}/product-spec.md`;
const jsonPath = `${outputDir}/product-spec.json`;
const generatedAt = new Date().toISOString();

const spec = {
  app_name: "WakeTask",
  generated_at: generatedAt,
  thesis:
    "WakeTask should feel immediately familiar to Apple Clock users while making the dismiss mission the unmistakable core of every alarm.",
  screens: [
    {
      name: "Alarm List",
      requirement:
        "Use a native iOS alarm-list mental model with large readable times, enabled state, selected mission, sound/ramp hint, and fast edit access.",
    },
    {
      name: "Alarm Create And Edit",
      requirement:
        "Keep the setup flow calm and predictable: time, repeat, label, sound, snooze, and a prominent mission picker above secondary options.",
    },
    {
      name: "Mission Picker",
      requirement:
        "Show mission cards with clear effort, setup needs, reliability notes, and visual examples so task selection is obvious before saving.",
    },
    {
      name: "Live Alarm Challenge",
      requirement:
        "When the alarm fires, block dismiss until the configured mission succeeds; make progress, failure, and retry states impossible to miss.",
    },
    {
      name: "Completion And Sharing",
      requirement:
        "After success, show streak/reward feedback and a shareable visual recap without making sharing required.",
    },
  ],
  missions: [
    {
      id: "math_memory",
      dismiss_rule: "Dismiss only after the required correct answers are completed.",
      viral_angle: "Quick proof that the sleeper is awake enough to think.",
    },
    {
      id: "barcode_qr_scan",
      dismiss_rule: "Dismiss only after scanning the saved code away from the bed.",
      viral_angle: "Obvious forced-movement demo for short-form video.",
    },
    {
      id: "photo_object_hunt",
      dismiss_rule: "Dismiss only after a target object/photo proof passes validation or a conservative manual fallback.",
      viral_angle: "Funny morning scavenger hunt.",
    },
    {
      id: "pushups_squats",
      dismiss_rule: "Dismiss only after motion/count verification reaches the configured target.",
      viral_angle: "High-energy physical wake-up clip.",
    },
    {
      id: "touch_grass_sky_photo",
      dismiss_rule: "Dismiss only after completing the outdoor/photo proof flow.",
      viral_angle: "Visual, meme-ready morning reset.",
    },
  ],
  acceptance_criteria: [
    "Apple Clock-like alarm list/edit/create flow is recognizable without literal copying.",
    "Mission selection is obvious during alarm setup and visible from the alarm list.",
    "Dismiss is blocked by the active mission engine until success.",
    "Alarm sound options support loud, ramping, and randomized behavior.",
    "Completion includes reward, streak, and optional shareable recap moments.",
    "Implementation is validated with local or hosted iOS evidence and durable Fabro artifacts.",
  ],
  non_goals: [
    "Human App Store submission.",
    "Copying Apple Clock, Alarmy, or Mobbin screenshots pixel-for-pixel.",
    "Accountability friend confirmation in this pass; keep it as a later backlog flow.",
    "Printing or storing secrets in artifacts.",
  ],
  risks: [
    "iOS background/alarm reliability requires careful validation on device or hosted macOS CI.",
    "Photo/object missions can overpromise if validation is not conservative.",
    "Viral task moments should not make core alarm setup feel noisy or gimmicky.",
  ],
  next_action: "Run the existing-app UX Studio workflow against this spec, then validate mission wiring and screenshot evidence.",
};

const markdown = `# WakeTask Product Feature Spec

Generated at: ${generatedAt}

## Source List

- User handoff context for WakeTask product direction and Fabro babysitting behavior.
- Maestro UX Studio workflow docs and WakeTask staged workflow contracts.
- Existing WakeTask repo target: /Users/timlife/Documents/claude code/waketask-ios.
- WakeTask PR: https://github.com/kimprobably/waketask-ios/pull/1.

## Target User

Heavy sleepers and professionals who need an alarm they cannot dismiss without meaningful wake-up engagement.

## Product Thesis

WakeTask should become a polished task-based alarm app that feels Apple Clock-like in its basic alarm mental model, while making missions the clear differentiator. The product should be familiar, fast, loud, reliable, and visually funny enough that the forced-action dismiss loop is instantly legible in short-form clips.

## Feature Pack

1. Apple Clock-like alarm list, edit, and create flow without literal copying.
2. Clear mission/task picker during alarm setup.
3. Real mission engine that blocks dismiss until success.
4. Live alarm challenge screen with visible progress and retry states.
5. Loud sound, ramping, and randomized alarm sound options.
6. Completion screen with streak, reward, and optional shareable result.
7. Later backlog: accountability friend flow where another person confirms or scans from their app.

## Screen Requirements

- Alarm List: readable time hierarchy, enabled state, mission summary, sound/ramp indicator, and fast edit/create access.
- Alarm Create And Edit: predictable iOS form structure with the mission picker promoted above secondary settings.
- Mission Picker: clear mission cards, setup requirements, effort level, and reliability notes.
- Live Alarm Challenge: full-screen alarm state, loud/urgent hierarchy, mission progress, no successful dismiss until the mission engine reports success.
- Completion And Sharing: reward/streak confirmation and a share-ready visual recap.

## Mission Engine Requirements

- Persist each alarm's mission configuration.
- Route alarm firing into the configured mission.
- Block dismiss until the mission returns success.
- Support math/memory, barcode or QR scan, object/photo hunt, pushups/squats, and outdoor/photo proof concepts.
- Provide conservative fallback states when sensors, camera, or permissions are unavailable.

## Sound Requirements

- Loud default alarm choices.
- Ramping volume behavior where platform limits allow it.
- Randomized alarm sound option to reduce habituation.
- Clear setup preview without weakening the real alarm path.

## Completion And Sharing

- Show success, streak, and reward feedback immediately after dismiss.
- Offer a shareable recap image or card, but never require sharing to complete the alarm.
- Make the completion moment visually distinct from setup screens.

## Non-Goals

${spec.non_goals.map((item) => `- ${item}`).join("\n")}

## Acceptance Criteria

${spec.acceptance_criteria.map((item) => `- ${item}`).join("\n")}

## Risks

${spec.risks.map((item) => `- ${item}`).join("\n")}

## No Secrets

No secrets, tokens, cookies, private keys, session values, or environment variable values should be printed or stored in WakeTask product artifacts.
`;

mkdirSync(outputDir, { recursive: true });
writeFileSync(markdownPath, markdown, "utf8");
writeFileSync(jsonPath, JSON.stringify(spec, null, 2) + "\n", "utf8");
