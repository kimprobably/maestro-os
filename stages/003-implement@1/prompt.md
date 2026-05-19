Goal: Build a tiny Joni-to-TipTap collaborative editor spike: mock Joni LinkedIn post generation streams into a collaborative TipTap/Yjs document. No production deploy or real LinkedIn/Hermes mutation.

## Completed stages
- **prepare**: succeeded
  - Script: `APP='spikes/joni-tiptap-collab-demo'; GOAL='docs/superpowers/plans/2026-05-17-joni-tiptap-collab-spike.md'; mkdir -p .workflow/joni-tiptap-spike "$APP"; test -s "$GOAL"; cp "$GOAL" .workflow/joni-tiptap-spike/goal.md; printf '{"app_dir":"%s","goal_path":"%s"}
' "$APP" "$GOAL" > .workflow/joni-tiptap-spike/input.json; echo joni-tiptap-spike-prepared`
  - Output:
    ```
    joni-tiptap-spike-prepared
    ```


# Implement the Joni + TipTap Collaboration Spike

You are running inside a Fabro Daytona coding sandbox for Maestro. Build the smallest useful spike, not a production product.

## Inputs

- Goal/spec: `docs/superpowers/plans/2026-05-17-joni-tiptap-collab-spike.md`
- App directory: `spikes/joni-tiptap-collab-demo`

Read the goal/spec first. Then implement the app in the app directory.

## Product goal

Prove that a LinkedIn-specialized agent like Joni can stream generated post content into a TipTap document while humans collaboratively edit the same document.

## Strict scope

Implement a local standalone spike only.

Include:

1. A React + TypeScript UI using TipTap.
2. A collaborative document using Yjs/Hocuspocus and TipTap collaboration extensions.
3. A mock Joni streaming endpoint using Server-Sent Events, e.g. `GET /api/joni/stream?topic=...`.
4. A UI flow:
   - user enters a post topic or prompt;
   - clicks a button such as “Ask Joni”;
   - the server streams LinkedIn post chunks;
   - chunks are inserted into the TipTap doc;
   - a second browser tab/window connected to the same document sees the content and can edit concurrently.
5. A README with setup, run commands, manual two-window verification steps, architecture notes, and explicit “not included in spike” section.
6. Build/typecheck/test scripts sufficient for the verification node to run `npm install`, `npm run typecheck --if-present`, `npm test --if-present`, and `npm run build`.

Exclude:

- No real Hermes/Joni API call.
- No real LinkedIn auth, posting, importing, scraping, or outbound send.
- No user auth.
- No persistence beyond in-memory local collaboration server state unless trivially provided by the chosen libraries.
- No production deploy.
- No secret values.

## Suggested implementation shape

Prefer a small Vite app plus a Node/Express server:

- `package.json`
- `src/App.tsx`
- `src/main.tsx`
- `src/styles.css`
- `server/index.ts`
- optional `server/joniMock.ts`
- `README.md`

Useful dependencies may include:

- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-collaboration`
- `@tiptap/extension-collaboration-caret`
- `@hocuspocus/provider`
- `@hocuspocus/server`
- `yjs`
- `express`
- `cors`
- `vite`
- `typescript`
- `tsx`
- `concurrently`

If an exact library API has changed, inspect installed package docs/types and choose the smallest compiling implementation.

## Acceptance criteria

The implementation is complete only if:

- `npm install` succeeds in the app directory.
- `npm run build` succeeds.
- The README describes a manual test with two browser sessions where one asks Joni and both sessions see/edit the same document.
- The app clearly labels generated content as mock Joni output.
- The implementation remains simple enough to throw away after the spike.

When finished, summarize changed files and verification commands run.