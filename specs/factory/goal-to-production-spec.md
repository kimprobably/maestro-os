# Goal-to-Production Factory Spec

**Mission ID**: `01KRFS3H5S27DCPFGTN2R7K4DQ`
**Slug**: `maestro-goal-to-production-auto-01KRFS3H`
**Created**: 2026-05-13
**Status**: Draft

---

## Purpose

Build an internal web tool that demonstrates the complete Maestro factory workflow: accepting a vague product idea, expanding it into an implementation-ready spec, orchestrating architecture design, implementation, review, simplification, and CI verification, then presenting quality gate status to the user.

This tool serves as both:
1. A working demonstration of the Maestro factory loop for internal development
2. A reusable pattern for future agent-driven development workflows

---

## Context

### Current State

- Spec Kitty CLI exists and provides mission/task management
- Fabro workflow engine supports DOT-based workflow orchestration
- Architecture principles, coding standards, and workflow standards are documented
- Validator library exists for deterministic quality gates
- Personas (Maestro, Smith, Scout, Quill) are defined

### Dependencies

- Spec Kitty CLI (`spec-kitty`) for mission/work package tracking
- Maestro CLI (`maestro`) for knowledge access, validation, workflow registration
- Fabro runtime for workflow execution
- Node.js environment for TypeScript/JavaScript tooling

### Constraints

- Internal tool only — no auth, billing, multi-tenancy, or production deployment
- Must demonstrate the factory loop without requiring external services
- Should be runnable locally with minimal setup
- Must follow all Maestro architecture principles and coding standards

---

## Non-Goals

**Out of Scope**:
- User authentication or authorization
- Multi-tenancy or team scoping
- Stripe billing integration
- Production deployment to Vercel/Railway
- Integration with Supabase or other databases
- Slack notification integration
- Real-time collaboration features
- Mobile-responsive UI (desktop-only is acceptable)
- Comprehensive error recovery UX beyond basic retry

**Explicitly Deferred**:
- Integration with GitHub/Linear/external project management
- Agent execution cost tracking and budgets
- Workflow execution history and audit logs beyond current run
- Customizable workflow templates (use fixed Solitaire pattern)

---

## Inputs

### Primary Input: Vague Goal

A freeform text description of a product idea, feature request, or implementation goal. Examples:

```
Build a tiny internal web tool that lets Tim paste a product idea, turns it
into an implementation spec, and shows the review status for each quality gate.
```

```
Create a dashboard that shows real-time enrichment job status from Clay webhooks
```

### Configuration Inputs

- `knowledge/`: Architecture principles, coding standards, workflow standards, validator library
- `prompts/`: Agent prompt templates for spec writing, implementation, review
- `.maestro/`: Runtime state directory for goals, context, workflow outputs

---

## Outputs

### Specification Document

- Path: `specs/factory/<goal-slug>-spec.md`
- Format: Markdown with frontmatter
- Sections: Purpose, Context, Non-goals, Inputs, Outputs, User stories, Functional requirements, Acceptance criteria, Definition of done, Architecture questions, Work packages, Reviewer plan, Verification plan, CI/CD plan, Simplification requirements, Risks, Spec Kitty references, ADR decision

### Implementation Artifacts

- Generated application code in `apps/generated-from-goal/<goal-slug>/`
- Tests (unit, integration, E2E as appropriate)
- README with setup/run instructions
- Package manifest (package.json or equivalent)

### Quality Evidence

- Spec review results
- Architecture review results
- Code review findings (correctness, tests, security, simplification)
- CI/CD verification output (typecheck, lint, tests passing)
- Final fidelity review summary

### Web UI

A simple web interface displaying:
1. **Input Form**: Textarea for vague goal, Submit button
2. **Progress View**: Current stage, completion percentage, elapsed time
3. **Stage Status**: Visual indicators (pending, in-progress, complete, failed) for:
   - Spec generation
   - Spec review
   - Architecture design
   - Implementation planning
   - Code generation
   - Code review
   - Simplification pass
   - CI verification
   - Final review
4. **Artifact Links**: Download/view links for spec, code, reviews, CI output
5. **Action Buttons**: Retry failed stage, Approve gates, View logs

---

## User Stories

### Story 1: Submit Vague Goal

**As** Tim (internal user)
**I want to** paste a vague product idea into a web form
**So that** the Maestro factory workflow transforms it into an implementation-ready spec

**Acceptance**:
- Single-page web UI with textarea (min 3 lines, max 5000 chars)
- Submit button triggers factory workflow
- UI transitions to progress view immediately
- Goal text is saved to `.maestro/factory/goal.md`

### Story 2: Monitor Workflow Progress

**As** Tim
**I want to** see real-time status of each factory stage
**So that** I can understand what the workflow is doing and identify blockers

**Acceptance**:
- Progress view shows 9 stages with status indicators
- Status updates every 2-5 seconds via polling or SSE
- Each stage shows: name, status (pending/in-progress/complete/failed), duration
- Failed stages display error summary and retry option
- Logs are viewable in-line or via expandable section

### Story 3: Review Generated Artifacts

**As** Tim
**I want to** access the generated spec, code, and review findings
**So that** I can evaluate quality and decide whether to merge/deploy

**Acceptance**:
- Artifact links appear as stages complete
- Spec is viewable in browser (markdown rendered)
- Code is downloadable as ZIP or viewable in tree structure
- Review findings are presented as categorized lists (Critical, Important, Minor)
- CI output is shown with pass/fail status and command output

### Story 4: Approve Quality Gates

**As** Tim
**I want to** approve or reject human gates (spec approval, architecture approval, final release)
**So that** the workflow does not proceed with irreversible actions without my consent

**Acceptance**:
- Human gates pause workflow and display approval UI
- Approval UI shows: what will happen if approved, what artifacts will change, cost/risk summary
- Approve/Reject/Edit buttons
- Rejected gates stop workflow and surface reason to user
- Approved gates resume workflow immediately

### Story 5: Retry Failed Stages

**As** Tim
**I want to** retry a failed stage with or without edits
**So that** I can recover from transient failures or incorrect inputs

**Acceptance**:
- Failed stages display "Retry" button
- Retry triggers re-execution of that stage only (not full workflow restart)
- Option to edit inputs (goal, spec, architecture notes) before retry
- Retry attempts are logged and limited to 3 per stage

---

## Functional Requirements

### FR1: Goal Ingestion

- Accept freeform text input (3-5000 characters)
- Sanitize and save to `.maestro/factory/goal.md`
- Trigger `load_context` stage (copy goal, load knowledge)
- Generate unique run ID for tracking

### FR2: Spec Kitty Integration

- Initialize Spec Kitty mission via `spec-kitty specify <feature-slug>`
- Parse Spec Kitty output JSON for mission ID, slug, paths
- Store mission metadata in `.maestro/factory/spec-kitty.json`
- Use mission slug in file paths and UI labels

### FR3: Workflow Orchestration

- Execute stages in order: load_context → init_spec_kitty → write_spec → review_spec → architecture_design → plan_implementation → implement_code → review_code → simplify_code → verify_ci → final_review
- Support stage-level retries with backoff
- Capture stdout/stderr from each stage script
- Persist stage status to `.maestro/factory/status.json`

### FR4: Spec Generation

- Agent reads: goal, context, Fabro patterns, Spec Kitty metadata
- Agent writes: implementation-ready spec to `specs/factory/<slug>-spec.md`
- Spec includes all required sections (see Outputs)
- Agent outputs JSON with spec path, ADR flag, work packages, reviewers, quality gates

### FR5: Review Fanout

- Spec review: product alignment, completeness, clarity
- Architecture review: layering, dependencies, STOP gates
- Code review: correctness, tests, security, simplification
- Final review: CI evidence, artifact quality, release readiness
- Each review produces JSON findings: severity (critical/important/minor), category, message, suggested fix
- Findings are aggregated and surfaced in UI

### FR6: Implementation Execution

- Generate code in `apps/generated-from-goal/<slug>/`
- Follow architecture principles: layers, explicit scope, fail loudly
- Follow coding standards: module headers, section dividers, whitelists
- Include tests (schema validation, route tests, service tests)
- Include README with setup/run instructions

### FR7: Deterministic Verification

- Run typecheck (if TypeScript)
- Run linter (ESLint, Prettier, or repo-standard)
- Run tests with coverage
- Run custom validators (no_select_star, route_thinness, allowed_fields_required, tests_present)
- Fail if any critical finding or deterministic check fails
- Produce machine-readable output (JSON or structured logs)

### FR8: Web UI Status Display

- Single-page app (React, Vue, or plain HTML/JS)
- Stage list with status icons (⏳ pending, ⚙️ in-progress, ✅ complete, ❌ failed)
- Progress bar (completed stages / total stages)
- Elapsed time per stage and total
- Expandable log viewer per stage
- Artifact download/view links
- Human gate approval UI (modal or inline)

### FR9: Idempotency and State Persistence

- Each run gets a unique run ID (ULID or UUID)
- State persisted to `.maestro/factory/status.json`
- Re-running the same goal resumes from last successful stage (optional: force restart flag)
- Artifacts are versioned by run ID if multiple runs of same goal

---

## Acceptance Criteria

### AC1: End-to-End Flow

**Given** a vague goal text
**When** submitted via web UI
**Then**:
- Spec is generated in `specs/factory/`
- Code is generated in `apps/generated-from-goal/`
- All quality gates pass (spec review, architecture review, code review, CI verification)
- Final review summary is displayed with pass/fail status
- Artifacts are downloadable and complete

### AC2: Quality Gate Enforcement

**Given** a spec with missing required sections
**When** spec review stage executes
**Then**:
- Review fails with "critical" finding listing missing sections
- Workflow pauses
- UI displays finding and offers retry with suggested fix
- Spec is not approved for architecture stage

### AC3: CI Verification Failure Handling

**Given** generated code with TypeScript errors
**When** CI verification stage runs typecheck
**Then**:
- Typecheck fails with error output
- Stage status is marked "failed"
- Error output is displayed in UI logs
- Retry button is enabled
- Workflow does not proceed to final review

### AC4: Human Gate Approval

**Given** workflow reaches final review human gate
**When** UI displays approval dialog
**Then**:
- Dialog shows: spec path, code path, review summaries, CI status
- Approve button is enabled only if all automated gates passed
- Rejecting gate stops workflow and logs reason
- Approving gate completes workflow and transitions UI to success state

### AC5: State Persistence Across Restarts

**Given** a workflow in progress (spec complete, architecture in-progress)
**When** the web server is restarted
**Then**:
- UI reloads and displays current stage status
- Completed stages remain marked complete
- In-progress stage resumes or retries as appropriate
- No duplicate work is performed

---

## Definition of Done

- [ ] Web UI is runnable locally with `npm install && npm start`
- [ ] All 9 workflow stages execute successfully for the provided example goal
- [ ] Spec includes all required sections and passes spec review
- [ ] Generated code follows architecture principles and coding standards
- [ ] Generated code includes tests with >80% coverage
- [ ] CI verification (typecheck, lint, tests) passes
- [ ] All code review findings are resolved (no critical/important)
- [ ] Final review produces "PASS" verdict
- [ ] Artifacts (spec, code, reviews, CI logs) are accessible via UI
- [ ] README includes setup instructions and architecture overview
- [ ] All code includes module headers with constraints
- [ ] No empty catch blocks, no raw console.log, no select('*')
- [ ] Workflow is registered via `maestro workflow register`

---

## Architecture Questions

### AQ1: Web Framework Choice

**Options**:
1. Plain HTML/JS (no build step, minimal dependencies)
2. React (component reuse, familiar to team)
3. Vue (simpler than React, good for small apps)
4. Next.js (overkill for internal tool, but matches mas-platform stack)

**Recommendation**: Plain HTML/JS or React. Avoid Next.js for this scope.

**Decision Required**: Tim to choose based on preference for simplicity vs. component reuse.

### AQ2: Backend Architecture

**Options**:
1. Static site + shell scripts (lightest, hardest to extend)
2. Node.js Express server + child_process for stage scripts (simple, standard)
3. Fabro-native workflow execution via API (most aligned, requires Fabro server)

**Recommendation**: Node.js Express server with child_process. Fabro integration deferred to Phase 2.

**Decision Required**: Confirm Express is acceptable for internal tool.

### AQ3: State Persistence

**Options**:
1. File-based (JSON in `.maestro/factory/status.json`)
2. SQLite database
3. In-memory (lost on restart)

**Recommendation**: File-based for MVP. SQLite if workflow history is needed.

**Decision Required**: Confirm file-based is sufficient.

### AQ4: Real-Time Updates

**Options**:
1. Polling (every 2-5 seconds)
2. Server-Sent Events (SSE)
3. WebSockets

**Recommendation**: Polling for MVP. SSE for Phase 2 if needed.

**Decision Required**: Confirm polling is acceptable initial UX.

### AQ5: Agent Execution Environment

**Options**:
1. Shell out to `maestro` CLI and Spec Kitty CLI
2. Call Fabro workflow API directly
3. Inline TypeScript/JavaScript agent logic

**Recommendation**: Shell out to existing CLIs. Reuse proven tools.

**Decision Required**: Confirm CLI integration is preferred over rewriting logic.

---

## Work Package Breakdown

### WP1: Project Scaffold

**Owner**: Smith (generated)
**Scope**:
- Initialize `apps/generated-from-goal/goal-to-production-factory/` directory
- Create `package.json` with dependencies (express, typescript, tsx, vitest)
- Create `tsconfig.json` with strict mode
- Create `.gitignore`
- Create `README.md` with setup instructions
- Create `bin/dev` script for local development

**Definition of Done**:
- `npm install` succeeds
- `npm run dev` starts server on localhost:3000
- README includes setup and run instructions

**Estimated Effort**: 30 minutes

---

### WP2: Web UI

**Owner**: Smith (generated)
**Scope**:
- Create `public/index.html` with input form and progress view
- Create `public/app.js` with:
  - Form submission handler
  - Status polling loop
  - Stage status rendering (icons, labels, durations)
  - Artifact link rendering
  - Human gate approval UI
  - Retry button handlers
- Create `public/styles.css` with minimal styling

**Definition of Done**:
- UI loads at `http://localhost:3000`
- Form submits goal text to `/api/submit`
- Progress view displays 9 stages with status icons
- Polling fetches `/api/status` every 3 seconds
- Artifact links appear as stages complete
- Human gate approval modal displays and POSTs to `/api/approve-gate`

**Estimated Effort**: 2 hours

---

### WP3: Backend API Routes

**Owner**: Smith (generated)
**Scope**:
- Create `src/server.ts` with Express app
- Implement `POST /api/submit` (save goal, trigger workflow, return run ID)
- Implement `GET /api/status/:runId` (read status.json, return stage statuses)
- Implement `GET /api/artifact/:runId/:type` (serve spec, code ZIP, review JSON, CI logs)
- Implement `POST /api/approve-gate/:runId/:gateId` (record approval, resume workflow)
- Implement `POST /api/retry/:runId/:stageId` (retry failed stage)

**Definition of Done**:
- All routes return JSON with `ok`, `data`, `error` envelope
- Routes validate inputs and return 400 for bad requests
- Routes return 404 for missing run IDs
- Routes log to structured logger with context

**Estimated Effort**: 3 hours

---

### WP4: Workflow Executor

**Owner**: Smith (generated)
**Scope**:
- Create `src/workflow/executor.ts` with:
  - `executeWorkflow(runId, goal): Promise<void>`
  - Stage definitions (name, script, validator)
  - Stage execution loop with status updates
  - Error handling and retry logic
  - Human gate pause/resume
- Create stage scripts in `scripts/stages/`:
  - `load_context.sh`
  - `init_spec_kitty.sh`
  - `write_spec.ts` (agent prompt + output parsing)
  - `review_spec.ts` (review agent)
  - `architecture_design.ts` (architecture agent)
  - `plan_implementation.ts` (planning agent)
  - `implement_code.ts` (code generation agent)
  - `review_code.ts` (code review agent)
  - `simplify_code.ts` (simplification agent)
  - `verify_ci.sh` (run typecheck, lint, tests)
  - `final_review.ts` (final review agent)

**Definition of Done**:
- `executeWorkflow` runs all stages in order
- Stage status is persisted to `.maestro/factory/runs/<runId>/status.json` after each stage
- Errors are logged and surfaced to UI
- Human gates pause execution and wait for approval
- Workflow resumes from last successful stage on retry

**Estimated Effort**: 6 hours

---

### WP5: Spec Agent Prompt

**Owner**: Smith (generated)
**Scope**:
- Create `prompts/factory/spec-agent.md` with:
  - Role: "You are the spec agent for the Maestro goal-to-production workflow"
  - Inputs: goal, context, Fabro patterns, Spec Kitty metadata
  - Output: spec path, ADR flag, work packages, reviewers, quality gates
  - Required spec sections
  - JSON output schema
- Create `src/agents/spec-agent.ts` to execute prompt and parse output

**Definition of Done**:
- Prompt produces valid spec for example goal
- Output JSON includes all required fields
- Spec includes all required sections
- Spec is implementation-ready (no ambiguous "figure it out" statements)

**Estimated Effort**: 2 hours

---

### WP6: Review Agents

**Owner**: Smith (generated)
**Scope**:
- Create `prompts/factory/spec-review.md`
- Create `prompts/factory/architecture-review.md`
- Create `prompts/factory/code-review.md`
- Create `prompts/factory/final-review.md`
- Create `src/agents/review.ts` with:
  - `reviewSpec(specPath): Promise<Finding[]>`
  - `reviewArchitecture(specPath, adrPath): Promise<Finding[]>`
  - `reviewCode(codePath): Promise<Finding[]>`
  - `finalReview(runId): Promise<{ verdict: 'PASS' | 'FAIL', summary: string }>`
- Each review outputs JSON findings with severity, category, message, suggested fix

**Definition of Done**:
- All review agents execute and return findings
- Findings JSON schema is validated
- Critical findings block workflow progression
- Review outputs are persisted and accessible via API

**Estimated Effort**: 4 hours

---

### WP7: CI Verification

**Owner**: Smith (generated)
**Scope**:
- Create `scripts/stages/verify_ci.sh` with:
  - `npm run typecheck` (or `tsc --noEmit`)
  - `npm run lint` (or `eslint`)
  - `npm test` (or `vitest run`)
  - Custom validators from validator library
- Parse output and produce JSON summary with pass/fail per check
- Persist to `.maestro/factory/runs/<runId>/ci-output.json`

**Definition of Done**:
- Script runs all checks
- Output includes pass/fail status, error messages, and affected files
- Script exits with code 0 if all pass, 1 if any fail
- Output is viewable in UI

**Estimated Effort**: 2 hours

---

### WP8: State Management

**Owner**: Smith (generated)
**Scope**:
- Create `src/state/run-state.ts` with:
  - `createRun(goal): RunState`
  - `updateStageStatus(runId, stageId, status, output?): void`
  - `getRunStatus(runId): RunState | null`
  - `listRuns(): RunState[]`
- RunState schema: `{ runId, goal, createdAt, stages: StageStatus[], artifacts: ArtifactPath[] }`
- StageStatus schema: `{ stageId, name, status, startedAt, completedAt, duration, output?, error? }`
- Persist to `.maestro/factory/runs/<runId>/status.json`

**Definition of Done**:
- State is created on workflow start
- Stage status updates are persisted immediately
- Status is readable across server restarts
- Status JSON schema is validated

**Estimated Effort**: 2 hours

---

### WP9: Integration Tests

**Owner**: Smith (generated)
**Scope**:
- Create `tests/integration/api.test.ts` with:
  - Test POST /api/submit → creates run, returns run ID
  - Test GET /api/status/:runId → returns stage statuses
  - Test POST /api/approve-gate → resumes workflow
  - Test POST /api/retry → retries failed stage
- Create `tests/integration/workflow.test.ts` with:
  - Test end-to-end workflow with example goal
  - Assert spec is generated
  - Assert code is generated
  - Assert all reviews pass
  - Assert CI verification passes
  - Assert final review verdict is PASS

**Definition of Done**:
- All integration tests pass
- Tests run in CI
- Coverage >80% for API routes and workflow executor

**Estimated Effort**: 3 hours

---

### WP10: Documentation

**Owner**: Smith (generated)
**Scope**:
- Update `README.md` with:
  - Purpose and context
  - Setup instructions
  - Run instructions
  - Architecture overview
  - Workflow stage descriptions
  - API endpoint documentation
  - Troubleshooting
- Create `docs/architecture.md` with:
  - System diagram
  - Data flow
  - Stage descriptions
  - Agent prompts
  - Validator library usage

**Definition of Done**:
- README is complete and accurate
- Architecture doc includes diagrams
- Documentation is reviewed and approved

**Estimated Effort**: 2 hours

---

## Reviewer Fanout Plan

### Spec Review

**Reviewers**:
- Product: Does the spec align with the stated goal?
- Engineering: Are all technical requirements clear and actionable?
- Quality: Are acceptance criteria measurable and complete?
- Security: Are there auth/validation gaps? (N/A for internal tool)

**Fan-in**: Consensus gate — all reviewers must approve or flag blockers.

**Output**: Aggregated findings JSON with severity, category, message.

---

### Architecture Review

**Reviewers**:
- Architecture: Does the design follow Maestro principles?
- ADR: Are architecture decisions documented with rationale?
- Dependency: Are dependencies minimal and justified?
- Migration: N/A (no database migrations for MVP)

**Fan-in**: Consensus gate — critical findings block implementation.

**Output**: Findings JSON + ADR recommendations.

---

### Code Review

**Reviewers**:
- Correctness: Does the code implement the spec?
- Tests: Are tests present, passing, and sufficient?
- Security: Are inputs validated, secrets protected, errors logged?
- Simplification: Can any code be deleted or simplified?

**Fan-in**: Wait-all policy — all reviewers produce findings, then consensus agent decides if critical findings block release.

**Output**: Findings JSON per reviewer, consensus summary.

---

### Final Review

**Reviewers**:
- CI/CD: Do all deterministic checks pass?
- Artifact Quality: Are all required artifacts present and complete?
- Fidelity: Does the implementation match the spec?
- Release Readiness: Are there any blockers to handoff?

**Fan-in**: Single consensus node — produces PASS/FAIL verdict.

**Output**: `{ verdict: 'PASS' | 'FAIL', summary: string, blockers?: string[] }`

---

## Deterministic Verification Plan

### TypeScript Projects

```bash
# Typecheck
npm run typecheck
# or
tsc --noEmit

# Lint
npm run lint
# or
eslint . --ext .ts,.tsx

# Test
npm test
# or
vitest run

# Format check
npx prettier --check .
```

### Custom Validators

```bash
# No select('*')
maestro verify no-select-star <code-path>

# Route thinness (routes <30 lines)
maestro verify route-thinness <code-path>

# Allowed fields required (update whitelists)
maestro verify allowed-fields-required <code-path>

# Tests present
maestro verify tests-present <code-path>
```

### Exit Codes

- `0`: All checks pass
- `1`: Validation failure (user-correctable)
- `2`: Infrastructure failure (retry recommended)

---

## CI/CD Plan

### Local CI

For MVP, CI runs locally via `verify_ci.sh` stage script. No external CI service required.

### Phase 2: GitHub Actions (Optional)

If repo is pushed to GitHub:

```yaml
name: Factory CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: ./scripts/verify-custom.sh
```

### Deployment

Not required for MVP. If needed in Phase 2:
- Railway or Vercel for web UI
- Environment variables for Maestro CLI paths, knowledge paths

---

## Simplification/Refactor Pass Requirements

After initial implementation, run simplification pass to:

1. **Delete unused code**: Remove any generated functions, types, or files not actually used
2. **Consolidate duplicates**: Merge similar stage scripts, review agents, or validators
3. **Shorten files**: Split files >300 lines into logical modules
4. **Remove premature abstractions**: Replace one-off helper functions with inline code if clearer
5. **Simplify error handling**: Remove try/catch blocks that only log and re-throw
6. **Review comments**: Delete comments that restate code, keep only constraint/invariant comments
7. **Check imports**: Remove unused imports, consolidate related imports

**Simplification Reviewer**: Dedicated agent reviews code for opportunities to delete or simplify.

**Acceptance**: Code review findings include "simplification" category. No critical simplification findings remain.

---

## Risks and STOP Gates

### Risk 1: Agent Execution Timeout

**Likelihood**: Medium
**Impact**: High (workflow hangs indefinitely)

**Mitigation**:
- Set 5-minute timeout per stage
- Surface timeout error in UI with retry option
- Log timeout events for monitoring

**STOP Gate**: None (timeout is recoverable via retry)

---

### Risk 2: Invalid Spec Output

**Likelihood**: Medium
**Impact**: High (downstream stages fail)

**Mitigation**:
- Validate spec output against JSON schema
- Spec review gate checks for required sections
- Retry with suggested fixes if validation fails

**STOP Gate**: Spec review gate — manual approval required if critical findings present

---

### Risk 3: Generated Code Does Not Compile

**Likelihood**: Medium
**Impact**: Medium (CI verification fails)

**Mitigation**:
- CI verification stage runs typecheck, lint, tests
- Code review agent checks for common errors
- Retry with fix suggestions if CI fails

**STOP Gate**: None (CI failure is recoverable via simplification pass and retry)

---

### Risk 4: Workflow State Corruption

**Likelihood**: Low
**Impact**: High (run cannot resume)

**Mitigation**:
- Atomic writes to `status.json` (write to temp file, then rename)
- Validate status JSON schema on read
- Backup previous state before overwrite

**STOP Gate**: None (corruption should be preventable via atomic writes)

---

### Risk 5: Excessive Retry Loops

**Likelihood**: Low
**Impact**: Medium (wasted time/cost)

**Mitigation**:
- Limit retries to 3 per stage
- Require manual intervention after 3 failures
- Surface error summary and suggested fix in UI

**STOP Gate**: Human gate after 3 retry failures — approve to continue or reject to abort

---

### Risk 6: Security Gaps in Generated Code

**Likelihood**: Low
**Impact**: High (vulnerable code merged)

**Mitigation**:
- Security review agent checks for common vulnerabilities
- Code review checklist includes auth, validation, secrets handling
- Follow Maestro coding standards (whitelists, validation, structured errors)

**STOP Gate**: Security review gate — critical security findings block final review approval

---

## Spec Kitty Mission/Work Package References

**Mission**: `maestro-goal-to-production-auto-01KRFS3H`
**Mission ID**: `01KRFS3H5S27DCPFGTN2R7K4DQ`
**Feature Dir**: `/Users/timlife/Documents/claude code/maestro-os/kitty-specs/maestro-goal-to-production-auto-01KRFS3H`
**Spec File**: `/Users/timlife/Documents/claude code/maestro-os/kitty-specs/maestro-goal-to-production-auto-01KRFS3H/spec.md`
**Meta File**: `/Users/timlife/Documents/claude code/maestro-os/kitty-specs/maestro-goal-to-production-auto-01KRFS3H/meta.json`

### Work Package Mapping

| Work Package | Spec Kitty Task | Estimated Effort |
|--------------|-----------------|------------------|
| WP1: Project Scaffold | Task 1: Scaffold | 30 min |
| WP2: Web UI | Task 2: Frontend | 2 hours |
| WP3: Backend API | Task 3: API Routes | 3 hours |
| WP4: Workflow Executor | Task 4: Orchestration | 6 hours |
| WP5: Spec Agent | Task 5: Spec Generation | 2 hours |
| WP6: Review Agents | Task 6: Review Fanout | 4 hours |
| WP7: CI Verification | Task 7: Deterministic Checks | 2 hours |
| WP8: State Management | Task 8: Persistence | 2 hours |
| WP9: Integration Tests | Task 9: Testing | 3 hours |
| WP10: Documentation | Task 10: Docs | 2 hours |

**Total Estimated Effort**: 26.5 hours

**Recommended Breakdown**:
- Sprint 1 (8 hours): WP1, WP2, WP3 (basic UI + API)
- Sprint 2 (10 hours): WP4, WP5 (workflow executor + spec agent)
- Sprint 3 (8.5 hours): WP6, WP7, WP8 (reviews + CI + state)
- Sprint 4 (0 hours, async): WP9, WP10 (tests + docs, can overlap with earlier sprints)

---

## ADR Decision with Reason

### ADR-001: Use Express + Shell Scripts for MVP

**Context**: Need to execute Maestro factory workflow stages and present status via web UI.

**Options Considered**:

1. **Fabro-native workflow execution via API**
   - Pros: Most aligned with Maestro architecture, reusable for other workflows
   - Cons: Requires Fabro server/API, increased complexity, unclear if Fabro API exists

2. **Node.js Express + child_process for stage scripts**
   - Pros: Simple, uses existing CLIs (maestro, spec-kitty), familiar to team
   - Cons: Less elegant than native workflow execution, harder to extend

3. **Static site + cron/polling for status**
   - Pros: Simplest possible implementation
   - Cons: Poor UX, no real-time updates, hard to handle human gates

**Decision**: Use Node.js Express + child_process (Option 2)

**Rationale**:
- Reuses existing Maestro CLI and Spec Kitty CLI without duplication
- Allows synchronous execution with status updates (better UX than polling)
- Familiar stack (Node.js, Express) reduces implementation risk
- Can be migrated to Fabro-native execution in Phase 2 once API is available

**Consequences**:
- Stage scripts are shell/TypeScript hybrid (not pure DOT workflow)
- State management is file-based (not database-backed)
- Agent execution is synchronous (blocks server thread, OK for single-user internal tool)

**Future Migration Path**:
- Phase 2: Replace Express executor with Fabro API calls
- Phase 3: Convert stage scripts to pure DOT workflow definitions
- Phase 4: Add workflow history, multi-run support, async execution

---

### ADR-002: File-Based State Persistence

**Context**: Need to persist workflow run state (stage statuses, artifacts, logs).

**Options Considered**:

1. **SQLite database**
   - Pros: Queryable, supports multiple runs, atomic transactions
   - Cons: Added dependency, schema migrations, overkill for single-run MVP

2. **File-based JSON**
   - Pros: Simple, human-readable, no dependencies, versionable
   - Cons: No transactions, harder to query, manual atomicity

3. **In-memory only**
   - Pros: Simplest implementation
   - Cons: Lost on server restart, no state recovery

**Decision**: File-based JSON (Option 2)

**Rationale**:
- Single-run use case does not require queryability or multi-run history
- JSON is human-readable and debuggable
- Atomic writes via temp file + rename avoid corruption
- Can migrate to SQLite in Phase 2 if history is needed

**Consequences**:
- State is not queryable (must read full JSON file)
- Multi-run history requires directory structure (`.maestro/factory/runs/<runId>/`)
- No database migrations or schema versioning

**Implementation Notes**:
- Use atomic writes: `fs.writeFileSync(tmpPath, json); fs.renameSync(tmpPath, finalPath);`
- Validate JSON schema on read to detect corruption
- Backup previous state before overwrite

---

### ADR-003: Plain HTML/JS for UI (No Framework)

**Context**: Need web UI for goal input, progress display, artifact links.

**Options Considered**:

1. **React**
   - Pros: Component reuse, familiar to team, good for complex state
   - Cons: Build step, dependencies, overkill for simple UI

2. **Vue**
   - Pros: Simpler than React, good for small apps
   - Cons: Still requires build step, unfamiliar to team

3. **Plain HTML/JS**
   - Pros: No build step, minimal dependencies, fast iteration
   - Cons: No component reuse, harder to manage complex state

**Decision**: Plain HTML/JS (Option 3)

**Rationale**:
- UI is simple (1 input form, 1 progress view, 1 approval modal)
- No complex state management needed (poll server for status)
- Fastest to implement and iterate
- Matches "internal tool, minimal setup" constraint
- Can be replaced with React in Phase 2 if UI grows

**Consequences**:
- No component reuse (acceptable for small UI)
- Inline event handlers and DOM manipulation
- Minimal CSS framework (or none)

**Implementation Notes**:
- Use `fetch()` for API calls
- Use `setInterval()` for status polling
- Use template literals for dynamic HTML rendering

---

## Appendix: Example Workflow Execution

### Input: Vague Goal

```
Build a tiny internal web tool that lets Tim paste a product idea, turns it
into an implementation spec, and shows the review status for each quality gate.
```

### Stage 1: load_context (10s)

**Script**: `scripts/stages/load_context.sh`

```bash
mkdir -p .maestro/factory
cp specs/factory/vague-goal.md .maestro/factory/goal.md
maestro knowledge get architecture-principles coding-standards workflow-standards \
  cli-conventions known-gotchas validator-library personas voice fabro-workflow-patterns \
  --format text > .maestro/factory/context.md
echo "context-loaded"
```

**Output**: `{ status: "complete", output: "context-loaded" }`

---

### Stage 2: init_spec_kitty (5s)

**Script**: `scripts/stages/init_spec_kitty.sh`

```bash
FEATURE="maestro-goal-to-production-auto"
spec-kitty specify "$FEATURE" --mission-type software-dev --json > .maestro/factory/spec-kitty.json
cat .maestro/factory/spec-kitty.json
```

**Output**: `{ status: "complete", output: { mission_slug: "...", mission_id: "...", ... } }`

---

### Stage 3: write_spec (60s)

**Agent**: Spec Agent

**Prompt**: (from `prompts/factory/spec-agent.md`)

**Output**: Spec written to `specs/factory/goal-to-production-spec.md`, JSON:

```json
{
  "spec_path": "specs/factory/goal-to-production-spec.md",
  "adr_required": true,
  "work_packages": ["WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7", "WP8", "WP9", "WP10"],
  "reviewers": ["spec-review", "architecture-review", "code-review", "final-review"],
  "quality_gates": ["spec-approval", "architecture-approval", "ci-verification", "final-approval"]
}
```

---

### Stage 4: review_spec (30s)

**Agent**: Spec Review Agent

**Findings**:

```json
[
  {
    "severity": "important",
    "category": "completeness",
    "message": "Work package WP4 should specify which shell (bash/zsh) is assumed for stage scripts",
    "suggested_fix": "Add shell declaration to WP4 scope"
  }
]
```

**Status**: `complete` (no critical findings, workflow continues)

---

### Stage 5: architecture_design (45s)

**Agent**: Architecture Agent

**Output**: ADR files written, architecture diagram generated

---

### Stage 6: plan_implementation (30s)

**Agent**: Planning Agent

**Output**: Implementation plan with task dependencies

---

### Stage 7: implement_code (5-10 min)

**Agent**: Code Generation Agent (Smith persona)

**Output**: Code written to `apps/generated-from-goal/goal-to-production-factory/`

---

### Stage 8: review_code (2 min)

**Agents**: Correctness, Tests, Security, Simplification reviewers (parallel)

**Findings**: Aggregated JSON with per-reviewer findings

---

### Stage 9: simplify_code (1-2 min)

**Agent**: Simplification Agent

**Output**: Refactored code, deleted unused functions

---

### Stage 10: verify_ci (30s)

**Script**: `scripts/stages/verify_ci.sh`

**Output**:

```json
{
  "typecheck": { "status": "pass" },
  "lint": { "status": "pass" },
  "tests": { "status": "pass", "coverage": 87 },
  "validators": { "status": "pass" }
}
```

---

### Stage 11: final_review (30s)

**Agent**: Final Review Agent

**Output**:

```json
{
  "verdict": "PASS",
  "summary": "All quality gates passed. Code follows architecture principles. Tests cover 87%. CI checks pass. Ready for handoff.",
  "blockers": []
}
```

---

## Next Steps

1. **Tim Review**: Review this spec and approve architecture decisions (AQ1-AQ5)
2. **Architecture Agent**: Design detailed system architecture and write ADRs
3. **Planning Agent**: Create task dependency graph and assign work packages
4. **Implementation**: Execute work packages WP1-WP10
5. **Review Loop**: Run reviewer fanout, fix findings, re-review until pass
6. **Simplification**: Run simplification pass, remove unused code
7. **CI Verification**: Run all deterministic checks
8. **Final Review**: Human gate approval for handoff
9. **Documentation**: Finalize README and architecture docs
10. **Handoff**: Present completed tool to Tim with demo

---

**End of Spec**
