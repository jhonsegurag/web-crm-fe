---
name: rf_implement
description: "Implement the feature `$ARGUMENTS` by reading its business spec from the `wip` phase and writing all production code required to satisfy its acceptance criteria."
disable-model-invocation: true
argument-hint: "[feature]"
---

This command is **generic** — it derives the file structure, tech stack, patterns, and conventions entirely from the spec and context files. It does not assume a fixed directory layout or framework.

Follow these steps exactly:

## Step 1 — Verify the feature is in wip

Check that `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md` exists.
If it does not exist, stop and tell the user:
"Feature '$ARGUMENTS' not found in flow/2-wip/. Run /rf_wip $ARGUMENTS first."

## Step 2 — Read the spec and project context

Read the following files in parallel:
- `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md` — full business spec: objective (§1), scope (§2), acceptance criteria (§5), API contract (§6), business rules (§7), error cases (§9), NFRs (§10), dependencies (§11)
- `ai_reactive_framework/context/0-context.md` — tech stack, architecture, conventions, canonical patterns
- `ai_reactive_framework/2-core_layer/architecture_specification/architecture_patterns_catalog.md` — distributed system patterns catalog

Also read `ai_reactive_framework/context/1-plan.md` only if it contains an entry for `$ARGUMENTS` — extract: service file path, knowledge base files, complexity. If no entry exists, skip.

## Step 3 — Discover existing code patterns

Read the existing source tree to understand the actual conventions in use:
- Glob `internal/**/*.go` to find current packages and file layout
- Read 1–2 existing implementation files most similar to the feature being built (same layer or same pattern)
- Read any knowledge base or template files listed in § 11 of the spec

Do NOT invent conventions. Use only what is observed in the codebase and stated in the spec.

## Step 3b — Evaluate Architecture Patterns

Using the catalog read in Step 2, evaluate each of the 4 patterns against the feature spec.
Apply these decision rules:

| Pattern | Apply when |
|---------|-----------|
| **Circuit Breaker** | §11 lists one or more external HTTP service dependencies |
| **Saga** | §11 lists multiple services that must be called in sequence AND failure of one requires compensating the others |
| **CQRS** | The feature has both read and write operations with clearly different performance profiles (e.g. read-heavy vs. write-heavy) |
| **Event Sourcing** | §7 business rules require a full audit trail of state changes OR temporal queries ("state at time T") are needed |

Output a **Patterns Decision Table** to the user before writing any code:

```
┌─────────────────────┬────────────┬─────────────────────────────────────────────┐
│ Pattern             │ Apply?     │ Rationale                                   │
├─────────────────────┼────────────┼─────────────────────────────────────────────┤
│ Circuit Breaker     │ YES / NO   │ <one-line reason from spec>                 │
│ Saga                │ YES / NO   │ <one-line reason from spec>                 │
│ CQRS                │ YES / NO   │ <one-line reason from spec>                 │
│ Event Sourcing      │ YES / NO   │ <one-line reason from spec>                 │
└─────────────────────┴────────────┴─────────────────────────────────────────────┘
```

For each pattern marked YES, also state:
- **Implementation impact**: which files are affected and what the canonical Go sketch looks like (from the catalog)
- **Trade-off accepted**: note the con(s) being accepted per the catalog trade-off table

If no patterns apply, state "No catalog patterns applicable — proceeding with plain hexagonal implementation."

Do NOT apply a pattern just because it exists. Apply only when the spec's content clearly matches the "When to use" criteria in the catalog.

## Step 4 — Derive the implementation plan

From the spec (§6 API contract, §11 dependencies), the observed codebase layout, and the patterns decided in Step 3b, determine:

1. **What files to create** — derive paths from existing conventions; do not hardcode assumptions
2. **What files to update** — identify any existing files that need wiring, registration, or import changes
3. **What patterns to follow** — canonical examples from Step 3 plus any catalog patterns from Step 3b
4. **Patterns to apply** — list each YES pattern with the specific files it affects

Present this plan as a short list before writing any code. If the spec's § 11 lists a service file path explicitly, use it. Otherwise derive from the naming convention observed in the codebase.

## Step 5 — Implement business logic

Write the service / core logic file(s):
- Implement all logic needed to satisfy **every** acceptance criterion in § 5
- Handle **every** error case in § 9 with the exact error type and descriptive message specified
- Enforce **every** business rule in § 7
- Apply **every** catalog pattern marked YES in Step 3b, using the canonical Go sketch from the catalog as the starting point
  - **Circuit Breaker**: wrap each external HTTP repository call with the breaker; emit a state-change metric on transition
  - **Saga**: implement choreography-based compensation handlers for each step that can fail
  - **CQRS**: place the command handler and query handler in separate files/packages
  - **Event Sourcing**: implement append-only event store writes; derive current state via event replay
- Propagate `context.Context` through all internal calls
- Keep the implementation stateless unless the spec explicitly requires state
- Do not make external HTTP calls unless § 11 lists an HTTP dependency
- Do not hardcode secrets — follow the conventions observed in `0-context.md`

## Step 6 — Implement the interface / adapter layer

Write the entry-point file (API handler, MCP tool struct, CLI command, etc.) derived from the spec § 6 API contract and the pattern observed in Step 3:
- Map every input field from § 6 to the internal call
- Map every output field from § 6 to the response
- On error: return the error shape specified in § 6 with `isError: true` (or equivalent for the tech stack)
- Apply any annotations, middleware, or decorators observed in equivalent existing files

## Step 7 — Wire up dependencies

Read the project entry point (e.g. `cmd/api/main.go`, `main.go`, or equivalent found in Step 3) and add:
- Constructor call for the new service/component
- Registration / mounting of the new interface layer
- Any required imports

Only touch the minimum necessary lines in the entry point.

## Step 8 — Write supporting files (if applicable)

If the implementation requires templates, fixtures, SQL migrations, config files, or embedded assets, write them now. Each must produce output that satisfies the acceptance criteria in § 5.

## Step 9 — Verify against acceptance criteria

For each item in § 5 of the spec, state:
- ✓ Satisfied — and which code satisfies it (file + function/line)
- ✗ Gap — explain why it cannot be satisfied and what is needed

Then, for each pattern marked YES in Step 3b, add a pattern compliance row:
- ✓ Pattern applied — name the file and function where the pattern is implemented
- ✗ Pattern gap — explain what is missing and why

Do not proceed silently past unsatisfied criteria or unapplied patterns.

## Step 10 — Confirm

Tell the user:
"✓ $ARGUMENTS implemented.

  Files written:
  <list every file created or updated>

  Acceptance criteria: <N>/<N> satisfied
  <list any gaps if present>

  Patterns applied: <list YES patterns or 'none'>
  <list any pattern gaps if present>

  Next: /rf_review $ARGUMENTS  (when ready for code review)"
