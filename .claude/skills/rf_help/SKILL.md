---
name: rf_help
description: "Show all available RF (Reactive Framework) commands with their descriptions and usage."
disable-model-invocation: true
---

Output the following exactly:

```
═══════════════════════════════════════════════
  RF Commands — ai-reactive-framework
═══════════════════════════════════════════════

  Command                   Args          Description
  ───────────────────────────────────────────────────────────────────────
  /rf_help                  —             Show this help message
  /rf_summary               —             Show all features, dependencies, and issues at a glance
  /rf_plan                  —             Generate a prioritized implementation plan from all context sources
  /rf_context               —             Generate or update all context files from requirements docs
  /rf_to_do  <feature>      feature name  Create a business spec and move feature into to_do phase
  /rf_wip    <feature>      feature name  Move feature from to_do → wip (start development)
  /rf_implement <feature>   feature name  Implement feature code from wip spec and acceptance criteria
  /rf_test  <feature>       feature name  Generate table-driven unit tests for all 4 layers
  /rf_validate <feature>    feature name  Validate code against 8 quality gates and write report
  /rf_monitors <feature>    feature name  Export 4 Datadog monitor JSONs to .datadog/ as IaC
  /rf_review <feature>      feature name  Move feature from wip → to_review (request code review)
  /rf_done   <feature>      feature name  Move feature from to_review → done (mark as completed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Flow
  ───────────────────────────────────────────────────────────────────────
  backlog → [/rf_to_do] → to_do → [/rf_wip] → wip → [/rf_implement] → wip → [/rf_test] → wip → [/rf_validate] → wip → [/rf_monitors] → wip → [/rf_review] → to_review → [/rf_done] → done

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Context files (auto-managed)
  ───────────────────────────────────────────────────────────────────────
  ai_reactive_framework/context/0-context.md           Project context, tech stack, architecture
  ai_reactive_framework/context/1-plan.md              Feature plan with priorities and complexity
  ai_reactive_framework/context/2-dependencies.md      External and internal dependency registry
  ai_reactive_framework/context/3-issues.md            Open issues, risks, and known limitations
  ai_reactive_framework/context/report/validation_report.md  Latest /rf_validate quality gate report

  Flow directories
  ───────────────────────────────────────────────────────────────────────
  ai_reactive_framework/flow/1-to_do/             Specs ready to implement
  ai_reactive_framework/flow/2-wip/               Features in active development
  ai_reactive_framework/flow/3-to_review/         Features awaiting code review
  ai_reactive_framework/flow/4-done/              Completed features

═══════════════════════════════════════════════
```
