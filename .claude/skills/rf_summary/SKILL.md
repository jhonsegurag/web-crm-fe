---
name: rf_summary
description: "Show a summary of all features, dependencies, and issues."
disable-model-invocation: true
---

Follow these steps exactly:

## Step 1 — Scan all phase directories

List the files in each of the four phase directories:
- `ai_reactive_framework/flow/1-to_do/`
- `ai_reactive_framework/flow/2-wip/`
- `ai_reactive_framework/flow/3-to_review/`
- `ai_reactive_framework/flow/4-done/`

## Step 2 — Read frontmatter from each file found

For each `.md` file found in any phase directory, read its frontmatter to extract:
- `feature`
- `phase`
- `priority`
- `created`
- `wip_started` (if present)
- `review_requested` (if present)
- `completed` (if present)

## Step 3 — Read the plan to find features not yet in flow

Read `ai_reactive_framework/context/1-plan.md` and extract all feature names and their priorities.
Any feature from the plan that has no file in any phase directory is considered `backlog`.

## Step 4 — Read dependencies and issues

Read `ai_reactive_framework/context/2-dependencies.md` and extract:
- Count of external dependencies (private + public)
- Count of internal tool→service mappings
- Any missing or unresolved dependency entries (fields left as `<placeholder>`)

Read `ai_reactive_framework/context/3-issues.md` and extract:
- Open issues (status: open or in_progress) with severity and affected component
- Risks with probability and impact
- Known limitations count
- Knowledge base gaps count
- Build & infrastructure issues count

## Step 5 — Render the summary

Output the following format:

```
═══════════════════════════════════════════════
  RF Summary — ai-reactive-framework
═══════════════════════════════════════════════

📋 BACKLOG (not yet started)
  Feature                        Priority
  ─────────────────────────────────────────
  <feature_name>                 P0/P1/P2
  ...

📝 TO DO (spec ready)
  Feature                        Priority   Created
  ─────────────────────────────────────────────────
  <feature_name>                 P0         <date>
  ...

🔧 WIP (in development)
  Feature                        Priority   Started
  ─────────────────────────────────────────────────
  <feature_name>                 P0         <date>
  ...

🔍 TO REVIEW (awaiting review)
  Feature                        Priority   Requested
  ──────────────────────────────────────────────────
  <feature_name>                 P1         <date>
  ...

✅ DONE (completed)
  Feature                        Priority   Completed
  ──────────────────────────────────────────────────
  <feature_name>                 P1         <date>
  ...

───────────────────────────────────────────────
  Total: <N> features
  Backlog: <N>  │  To Do: <N>  │  WIP: <N>  │  Review: <N>  │  Done: <N>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 DEPENDENCIES
  External (private registry):   <N> packages
  External (public):             <N> packages
  Tool → Service mappings:       <N>
  Tool → Knowledge Base mappings:<N>
  Unresolved placeholders:       <N>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 ISSUES & RISKS
  Open Issues
  ──────────────────────────────────────────────────
  [<severity>] <ISSUE-ID> — <title>  (<affected component>)
  ...

  ⚠ Risks
  ──────────────────────────────────────────────────
  [<probability>/<impact>] <RISK-ID> — <title>
  ...

  Known Limitations:     <N>
  Knowledge Base Gaps:   <N>
  Build/Infra Issues:    <N>

═══════════════════════════════════════════════
```

Rules:
- Omit any section entirely if it has no entries.
- Use priority from the plan for backlog items; use frontmatter priority for items already in flow.
- In the Issues block, list only open/in_progress issues. Skip resolved ones.
- If `2-dependencies.md` or `3-issues.md` is empty, show `(no data)` for that block.
