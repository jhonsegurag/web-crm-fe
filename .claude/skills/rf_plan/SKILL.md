---
name: rf_plan
description: "Generate a prioritized implementation plan by reading all project context sources and producing a consolidated summary ready for development."
disable-model-invocation: true
---

Follow these steps exactly:

## Step 1 — Read all context sources in parallel

Read the following files simultaneously:
- All `.md` files under `ai_reactive_framework/context/requirements/` — RFC docs describing architecture, execution model, layers, and patterns
- `ai_reactive_framework/context/1-features.md` — feature list with priorities and complexity
- `ai_reactive_framework/context/2-dependencies.md` — external/internal dependency registry
- `ai_reactive_framework/context/3-issues.md` — open issues, risks, and known limitations

Also read `ai_reactive_framework/context/0-context.md` if it exists — tech stack and architectural conventions.

## Step 2 — Read current flow state

List files in all phase directories to determine what is already in progress or done:
- `ai_reactive_framework/flow/1-to_do/`
- `ai_reactive_framework/flow/2-wip/`
- `ai_reactive_framework/flow/3-to_review/`
- `ai_reactive_framework/flow/4-done/`

For each file found, read its frontmatter: `feature`, `phase`, `priority`.

## Step 3 — Derive the implementation plan

From all sources collected in Steps 1–2, determine:

1. **Features not yet started** (not in any flow directory) — treat as backlog
2. **Features already in progress** — carry their current phase
3. **Blocking issues** — open issues from `3-issues.md` that affect backlog or WIP features
4. **Unresolved dependencies** — entries with `<placeholder>` in `2-dependencies.md` that are required by pending features
5. **Implementation order** — sort features by:
   - Priority (P0 > P1 > P2)
   - Dependency satisfaction (features with all deps resolved first)
   - Blocking issues (features blocked by open issues go last)

For each feature derive:
- **Implementation layers needed** — based on the RFC layer stack (domain → service → provider → client → controller → route)
- **Key files to create or modify** — inferred from the layer pattern in the RFC and existing codebase conventions
- **Dependencies required** — cross-referenced from `2-dependencies.md`
- **Risks or blockers** — matched from `3-issues.md`

## Step 4 — Render the plan

Output the following format to the user AND write it to `ai_reactive_framework/context/4-plan.md`, overwriting any existing content.

Add this frontmatter at the top of `4-plan.md` before the plan content:

```
---
generated: <today's date in YYYY-MM-DD>
sources:
  - ai_reactive_framework/context/requirements/
  - ai_reactive_framework/context/1-features.md
  - ai_reactive_framework/context/2-dependencies.md
  - ai_reactive_framework/context/3-issues.md
---
```

Then append the full plan below the frontmatter.

```
═══════════════════════════════════════════════════════
  RF Implementation Plan
═══════════════════════════════════════════════════════

  Tech Stack:   <language> · <framework> · <platform>
  Architecture: <execution model in one line>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 IMPLEMENTATION ORDER
  ───────────────────────────────────────────────────────────────────────
  #  Feature                    Priority  Phase      Complexity  Blocker?
  ──────────────────────────────────────────────────────────────────────
  1  <feature_name>             P0        backlog    high        —
  2  <feature_name>             P0        wip        medium      —
  3  <feature_name>             P1        backlog    low         ISSUE-01
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 FEATURE BREAKDOWN
  ───────────────────────────────────────────────────────────────────────

  [#1] <feature_name>  ·  P0  ·  <phase>
  ──────────────────────────────────────────
  Objective:      <one-line goal from requirements>
  Layers needed:  domain → service → provider → controller → route
  Files to create:
    - src/api/domain/<domain>/
    - src/api/services/<domain>_service.go
    - src/api/services/<domain>_service_mock.go
    - src/api/providers/<domain>_provider.go
    - src/api/providers/<domain>_provider_mocks.go
    - src/api/clients/queue/<domain>_queue/
    - src/api/controllers/<domain>/
  Files to update:
    - src/api/app/server.go  (route registration)
  Dependencies:   <package@version or "none">
  Risks:          <ISSUE-ID or "none">

  [#2] <feature_name>  ·  P1  ·  <phase>
  ──────────────────────────────────────────
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 DEPENDENCY READINESS
  ───────────────────────────────────────────────────────────────────────
  Package / Service              Status       Required by
  ─────────────────────────────────────────────────────────────────────
  <package_name>                 ✓ resolved   <feature_name>
  <package_name>                 ✗ missing    <feature_name>
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ BLOCKERS & RISKS
  ───────────────────────────────────────────────────────────────────────
  [<severity>] <ISSUE-ID> — <title>
    Affects: <feature_name>
    Action:  <recommended action>
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 NEXT STEPS
  ───────────────────────────────────────────────────────────────────────
  1. /rf_to_do <feature>   — generate spec for next backlog feature
  2. /rf_wip   <feature>   — start active development
  3. /rf_implement <feature> — implement from spec
  4. Resolve <ISSUE-ID>    — unblock <feature_name>

═══════════════════════════════════════════════════════
```

Rules:
- Omit any section that has no entries (e.g. no blockers → skip BLOCKERS section).
- Features already in `done/` are excluded from the plan entirely.
- If a feature is in `wip/` or `to_review/`, show it at the top of the order with its current phase — do not re-rank it below backlog items.
- Derive layer files from the RFC layer stack. Only list layers that are actually needed for the feature — not all layers are required for every feature.
- In DEPENDENCY READINESS, only show dependencies that are referenced by features in the plan.
- In NEXT STEPS, list at most 4 concrete actions, ordered by immediacy.
- Always write the final plan to `ai_reactive_framework/context/4-plan.md` (overwrite). Confirm to the user with: "✓ Plan written to ai_reactive_framework/context/4-plan.md"
