# Joni Tiptap Collaborative Draft Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest standalone demo where a mock Joni draft streams into a collaborative Tiptap document that two browser sessions can edit live.

**Architecture:** Create a throwaway Vite/React app under `spikes/joni-tiptap-collab-demo`. A single Node/Express server serves the built frontend, exposes `GET /api/joni/stream` as Server-Sent Events, and hosts Hocuspocus at `/collaboration` for Yjs document sync. The demo does not call Hermes, Fabro, Slack, Honcho, or existing Maestro services.

**Tech Stack:** React, Vite, Tiptap, `@tiptap/extension-collaboration`, Yjs, Hocuspocus, Express, Server-Sent Events.

---

## Time Estimate

Fast local-only demo: 3-4 hours.

Externally shareable Railway-style demo: 4-6 hours.

Product-quality version with auth, persistence, Joni integration, document library, comments, and edit capture: 2-4 days.

This plan targets the 4-6 hour version because it can run locally or on a new throwaway Railway service without depending on existing Maestro infrastructure.

## File Structure

- Create `spikes/joni-tiptap-collab-demo/package.json`: scripts and dependencies.
- Create `spikes/joni-tiptap-collab-demo/index.html`: Vite entry HTML.
- Create `spikes/joni-tiptap-collab-demo/server/index.mjs`: Express app, SSE mock Joni stream, Hocuspocus WebSocket route, static file serving.
- Create `spikes/joni-tiptap-collab-demo/src/main.jsx`: React entry.
- Create `spikes/joni-tiptap-collab-demo/src/App.jsx`: Tiptap editor, collaboration provider, stream button, status UI.
- Create `spikes/joni-tiptap-collab-demo/src/styles.css`: minimal editor styling.
- Create `spikes/joni-tiptap-collab-demo/README.md`: runbook and demo script.

Relevant docs:

- Tiptap collaborative editing with Hocuspocus: https://tiptap.dev/docs/hocuspocus/guides/collaborative-editing
- Hocuspocus provider install/config: https://tiptap.dev/docs/hocuspocus/provider/install
- Hocuspocus Express integration: https://tiptap.dev/docs/hocuspocus/server/examples
- Tiptap AI Toolkit streaming reference for later upgrade: https://tiptap.dev/docs/content-ai/capabilities/ai-toolkit/agents/streaming

---

### Task 1: Scaffold The Standalone Demo App

**Files:**
- Create: `spikes/joni-tiptap-collab-demo/package.json`
- Create: `spikes/joni-tiptap-collab-demo/index.html`
- Create: `spikes/joni-tiptap-collab-demo/src/main.jsx`
- Create: `spikes/joni-tiptap-collab-demo/src/styles.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "joni-tiptap-collab-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5174",
    "server": "node server/index.mjs",
    "build": "vite build",
    "start": "node server/index.mjs",
    "check": "npm run build"
  },
  "dependencies": {
    "@hocuspocus/provider": "latest",
    "@hocuspocus/server": "latest",
    "@tiptap/extension-collaboration": "latest",
    "@tiptap/extension-collaboration-caret": "latest",
    "@tiptap/react": "latest",
    "@tiptap/starter-kit": "latest",
    "@vitejs/plugin-react": "latest",
    "express": "latest",
    "express-ws": "latest",
    "vite": "latest",
    "yjs": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Joni Collaborative Draft Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create `src/main.jsx`**

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Create `src/styles.css`**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #f7f7f4;
  color: #191919;
}

.shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
}

.status {
  color: #5f5f57;
  font-size: 14px;
}

button {
  border: 1px solid #191919;
  background: #191919;
  color: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.editor {
  min-height: 620px;
  border: 1px solid #d8d7d0;
  background: #fff;
  border-radius: 8px;
  padding: 28px;
}

.editor .ProseMirror {
  min-height: 560px;
  outline: none;
  font-size: 18px;
  line-height: 1.58;
}

.editor .ProseMirror p {
  margin: 0 0 16px;
}

.collaboration-cursor__caret {
  border-left: 2px solid;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  position: relative;
}

.collaboration-cursor__label {
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  left: -1px;
  line-height: 1;
  padding: 3px 6px;
  position: absolute;
  top: -1.4em;
  white-space: nowrap;
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
cd spikes/joni-tiptap-collab-demo
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 6: Commit scaffold**

```bash
git add spikes/joni-tiptap-collab-demo
git commit -m "spike: scaffold Joni collaborative draft demo"
```

---

### Task 2: Add Mock Joni Stream And Collaboration Server

**Files:**
- Create: `spikes/joni-tiptap-collab-demo/server/index.mjs`

- [ ] **Step 1: Create `server/index.mjs`**

```js
import express from "express";
import expressWebsockets from "express-ws";
import { Hocuspocus } from "@hocuspocus/server";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const port = Number(process.env.PORT || 8787);

const hocuspocus = new Hocuspocus({
  name: "joni-tiptap-collab-demo",
});

const { app } = expressWebsockets(express());

const draftChunks = [
  "I would not add another LinkedIn post until the follow-up path can turn attention into pipeline.\\n\\n",
  "If you're a B2B founder selling through your own audience, this is usually where the leak starts.\\n\\n",
  "The post works. Someone replies. A useful objection shows up in the comments. A possible sales angle appears.\\n\\n",
  "Then it disappears into Slack.\\n\\n",
  "That is not a content problem. It is an operating loop problem.\\n\\n",
  "The useful setup is boring:\\n\\n",
  "The post idea enters in one place. Replies and questions get captured. The founder reviews the useful ones once a week. Sales knows what to do next.\\n\\n",
  "tbh, that is the part most tools skip.\\n\\n",
  "If LinkedIn is creating activity but not pipeline, I would fix that loop before asking for more posts.",
];

app.ws("/collaboration", (websocket, request) => {
  hocuspocus.handleConnection(websocket, request, {
    user: {
      id: request.headers["x-demo-user"] || "anonymous",
      name: request.headers["x-demo-user"] || "anonymous",
    },
  });
});

app.get("/api/joni/stream", async (_request, response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders?.();

  for (const chunk of draftChunks) {
    response.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\\n\\n`);
    await new Promise((resolve) => setTimeout(resolve, 450));
  }

  response.write(`data: ${JSON.stringify({ type: "done" })}\\n\\n`);
  response.end();
});

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use(express.static(dist));
app.get("*", (_request, response) => {
  response.sendFile(path.join(dist, "index.html"));
});

app.listen(port, () => {
  console.log(`Joni Tiptap demo listening on http://127.0.0.1:${port}`);
});
```

- [ ] **Step 2: Run server before frontend exists**

Run:

```bash
cd spikes/joni-tiptap-collab-demo
node server/index.mjs
```

Expected: server starts. `/health` returns `{"ok":true}`. `/` returns 404 or missing file until the frontend is built.

- [ ] **Step 3: Commit server**

```bash
git add spikes/joni-tiptap-collab-demo/server/index.mjs
git commit -m "spike: add Joni stream and collaboration server"
```

---

### Task 3: Build Collaborative Tiptap Editor And Stream Insert

**Files:**
- Create: `spikes/joni-tiptap-collab-demo/src/App.jsx`

- [ ] **Step 1: Create `src/App.jsx`**

```jsx
import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

function randomUser() {
  const names = ["Tim", "Malaika", "Iza", "Ajmal"];
  const colors = ["#2563eb", "#c026d3", "#059669", "#dc2626"];
  const index = Math.floor(Math.random() * names.length);
  return { name: names[index], color: colors[index] };
}

function websocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/collaboration`;
}

function insertText(editor, text) {
  editor
    .chain()
    .focus()
    .insertContent(text.split("\\n").map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" })))
    .run();
}

export default function App() {
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("Connected draft room: joni-demo");

  const user = useMemo(() => randomUser(), []);
  const provider = useMemo(() => {
    const ydoc = new Y.Doc();
    return new HocuspocusProvider({
      url: websocketUrl(),
      name: "joni-demo",
      document: ydoc,
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        document: provider.document,
      }),
      CollaborationCaret.configure({
        provider,
        user,
      }),
    ],
  });

  async function streamJoniDraft() {
    if (!editor || streaming) return;

    setStreaming(true);
    setStatus("Joni is drafting...");

    const eventSource = new EventSource("/api/joni/stream");

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chunk") {
        insertText(editor, message.text);
      }
      if (message.type === "done") {
        eventSource.close();
        setStreaming(false);
        setStatus("Draft streamed. Edit together in this doc.");
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setStreaming(false);
      setStatus("Stream failed. Restart the demo server and try again.");
    };
  }

  return (
    <main className="shell">
      <section className="toolbar">
        <div>
          <h1 className="title">Joni collaborative draft spike</h1>
          <div className="status">{status}</div>
        </div>
        <button type="button" onClick={streamJoniDraft} disabled={!editor || streaming}>
          {streaming ? "Streaming..." : "Generate with Joni"}
        </button>
      </section>
      <section className="editor">
        <EditorContent editor={editor} />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Build the app**

Run:

```bash
cd spikes/joni-tiptap-collab-demo
npm run build
```

Expected: Vite build succeeds and creates `dist/`.

- [ ] **Step 3: Run the full demo server**

Run:

```bash
cd spikes/joni-tiptap-collab-demo
npm start
```

Expected: server starts on `http://127.0.0.1:8787`.

- [ ] **Step 4: Manual demo acceptance**

1. Open `http://127.0.0.1:8787` in two browser windows.
2. Click `Generate with Joni` in one window.
3. Confirm text streams into both windows.
4. Type in the second window while the stream is running.
5. Confirm both windows converge on the same document.

- [ ] **Step 5: Commit editor**

```bash
git add spikes/joni-tiptap-collab-demo/src/App.jsx spikes/joni-tiptap-collab-demo/src/styles.css spikes/joni-tiptap-collab-demo/package-lock.json
git commit -m "spike: stream Joni draft into collaborative editor"
```

---

### Task 4: Add README And Optional Railway Demo

**Files:**
- Create: `spikes/joni-tiptap-collab-demo/README.md`

- [ ] **Step 1: Create README**

```md
# Joni Tiptap Collaborative Draft Demo

This is a standalone spike. It does not call Hermes, Fabro, Slack, Honcho, or any Maestro runtime.

## Run

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

Open:

\`\`\`
http://127.0.0.1:8787
\`\`\`

Open the same URL in two browser windows. Click **Generate with Joni** in one window. The mock draft streams into the collaborative document and can be edited from either window.

## What This Proves

- A Joni-style draft can stream into a rich text editor.
- The document remains collaboratively editable while text is streaming.
- The UX can be demonstrated without integrating the real agent stack.

## What This Does Not Prove

- Real Joni invocation.
- Auth.
- Persistence after process restart.
- Human edit capture.
- Commenting or suggestion mode.
- Tiptap AI Toolkit licensing or private registry setup.

## Later Upgrade Path

1. Replace `/api/joni/stream` mock chunks with a real Joni/Fabro draft stream.
2. Persist Yjs documents with Hocuspocus persistence.
3. Add document list and saved draft versions.
4. Capture human edits as before/after examples for Joni evals.
5. Consider Tiptap AI Toolkit if we want their agent editing primitives instead of plain SSE insertion.
\`\`\`

- [ ] **Step 2: Optional Railway deployment**

If a shareable URL is needed, create a new throwaway Railway service from `spikes/joni-tiptap-collab-demo`.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Expected: Railway provides one public URL. WebSocket collaboration works through `/collaboration`, and SSE works through `/api/joni/stream`.

- [ ] **Step 3: Commit docs**

```bash
git add spikes/joni-tiptap-collab-demo/README.md
git commit -m "docs: document Joni collaborative draft spike"
```

---

## Demo Script

1. Open the same public URL in two browser windows.
2. Say: "This is not wired to Joni yet. It is only proving the document UX."
3. Click `Generate with Joni`.
4. Watch the post stream into the doc.
5. Edit a line from the second browser.
6. Explain: "The real version swaps the canned SSE endpoint for Joni, then stores human edits as feedback."

## Keep Out Of Scope

- Real Slack/Joni invocation.
- Real LinkedIn data.
- Auth.
- Comments.
- Document persistence.
- Promptfoo evals.
- Company brain integration.
- Publishing or scheduling.
