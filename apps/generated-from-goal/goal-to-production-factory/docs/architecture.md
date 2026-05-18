# Architecture

## System Overview

Goal-to-Production Factory is an internal web tool that demonstrates the complete Maestro factory workflow.

### Components

- **Express API Server**: HTTP endpoints for submitting goals, checking status, and serving artifacts
- **Workflow Executor**: Orchestrates 7-stage pipeline with validators and human gates
- **State Manager**: File-based state persistence with atomic writes
- **Web UI**: Plain HTML/JS interface for goal submission and progress monitoring

### Data Flow

```
User Input (Goal Text)
  ↓
POST /api/submit → Create Run
  ↓
Workflow Executor → Execute Stages
  ↓
Stage Scripts → Generate Outputs
  ↓
Validators → Verify Outputs
  ↓
Human Gates → Await Approval
  ↓
GET /api/status → Display Progress
  ↓
Artifacts → Download/View
```

### 7-Stage Workflow

1. **Load Context** — Load goal and knowledge base
2. **Write Spec** — Generate implementation-ready spec
3. **Review Spec** — Review for completeness + spec_approval gate (FLAG)
4. **Implement Code** — Generate code with tests
5. **Verify CI** — Run typecheck, lint, tests, validators
6. **Final Review** — Check quality gates + final_handoff gate (STOP)
7. **Emit Summary** — Generate run summary event

### State Persistence

- Location: `.maestro/factory/runs/<runId>/status.json`
- Atomic writes: temp file + rename
- Backup before each write: `status.backup.json`
- Validated with Zod schemas on read

### Module Boundaries

- **Routes**: Under 30 lines, no business logic, Zod validation
- **State Manager**: Never imports routes/executor, atomic writes only
- **Workflow Executor**: Never imports Express types, never mutates state directly
- **Agents**: Never import executor/state, 5-minute timeout

## Phase 2 Migration

Future integration with Fabro runtime:
- Convert stage scripts to DOT workflow nodes
- Add concurrent review fanout
- Integrate Slack for persona messages
- Add workflow history UI
