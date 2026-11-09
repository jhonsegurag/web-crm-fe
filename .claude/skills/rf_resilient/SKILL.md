---
name: rf_resilient
description: "Recommend resilience patterns from the architecture catalog, present a numbered menu, and render a full implementation guide for the chosen pattern."
disable-model-invocation: true
argument-hint: "[pattern]"
---

If the user provides a pattern name as an argument (e.g. `/rf_resilient circuit_breaker`), skip the menu and go directly to Step 4 for that pattern.

---

## Step 1 — Read sources in parallel

Read all of the following files simultaneously:

- `ai_reactive_framework/2-core_layer/architecture_specification/architecture_patterns_catalog.md`
- `ai_reactive_framework/2-core_layer/architecture_specification/trade_off_catalog.md`
- `ai_reactive_framework/2-core_layer/architecture_specification/quality_attributes_catalog.md`
- `ai_reactive_framework/context/0-context.md`

---

## Step 2 — Identify resilience patterns

From the files read in Step 1, collect every pattern that addresses one or more of:

- Failure isolation (prevent a failing dependency from taking down the caller)
- Fault tolerance (the system continues operating despite partial failures)
- Transient error recovery (automatic retries, backoff)
- Resource protection (bulkheads, rate limiting, timeouts)
- Distributed consistency / rollback (sagas, compensating transactions)
- Graceful degradation (fallback, cached responses, default values)

For each pattern found in the catalog, extract:
- **Name**
- **One-line description** (≤ 12 words)
- **Catalog status**: `documented` (full entry exists) or `stub` (mentioned but no implementation sketch)

Patterns NOT found in the catalog at all should be listed separately as `not yet documented`.

The canonical resilience pattern set to check against:

| Pattern | Look for in catalog |
|---------|---------------------|
| Circuit Breaker | any entry with "circuit breaker" / "gobreaker" |
| Retry + Exponential Backoff | any entry with "retry" / "backoff" / "jitter" |
| Bulkhead | any entry with "bulkhead" / "semaphore" / "worker pool isolation" |
| Timeout / Deadline | any entry with "timeout" / "context deadline" |
| Saga (Compensation) | any entry with "saga" / "compensating transaction" |
| Fallback / Graceful Degradation | any entry with "fallback" / "degradation" / "stale cache" |

---

## Step 3 — Render the options menu

Output the following table to the user. Number only the `documented` patterns first, then list `stub` patterns, then mention `not yet documented` ones at the end.

```
================================================================
  rf_resilient — Resilience Pattern Advisor
================================================================

  Documented patterns (full guide available):
  ┌────┬──────────────────────────────┬────────────────────────────────────────┐
  │ #  │ Pattern                      │ Description                            │
  ├────┼──────────────────────────────┼────────────────────────────────────────┤
  │ 1  │ <Pattern Name>               │ <one-line description>                 │
  │ 2  │ ...                          │ ...                                    │
  └────┴──────────────────────────────┴────────────────────────────────────────┘

  [if stub patterns exist]
  Stub patterns (mentioned in catalog, no implementation sketch yet):
    - <Pattern Name>: <one-line description>

  [if not-yet-documented patterns exist]
  Not yet in catalog:
    - <Pattern Name>: <one-line description>
    (use /rf_resilient add <pattern_name> to request documentation)

================================================================
  Enter the number or name of the pattern to get a full guide.
================================================================
```

Wait for the user to choose before continuing.

---

## Step 4 — Render the full guide for the chosen pattern

Once the user selects a pattern (by number or name), output all of the following sections. Pull content from the catalog entry; for fields not covered in the catalog, derive sensible content from your knowledge of Go and platform conventions and industry best practices.

### 1. Overview

- **Pattern name**
- **Category**: Resilience > [sub-category: Failure Isolation | Recovery | Resource Protection | Consistency]
- **TL;DR**: one sentence explaining what problem it solves

### 2. When to use

Bullet list of concrete scenarios where this pattern is the right choice for a Go service running on your platform.

### 3. When NOT to use

Bullet list of scenarios where this pattern adds unnecessary complexity or is counter-productive.

### 4. Go Implementation Sketch

Provide a complete, working Go code snippet following these conventions:
- Module path prefix: `github.com/your-org/your-service`
- Architecture layers: Handler → Orchestrator → UseCase → Repository → Client
- Compile-time interface guard: `var _ Port = (*impl)(nil)`
- Error wrapping with `%w`; use `ucerr` package for usecase errors, `repoerr` for repository errors
- No hardcoded secrets; no global mutable state
- Comments in English

If the pattern involves a third-party library (e.g. `sony/gobreaker`), show the import and note whether it is already in `go.mod` or needs to be added.

### 5. Trade-offs

| Pro | Con |
|-----|-----|
| ... | ... |

### 6. Combination Advice

List patterns that work well together with this one and briefly explain why. Example:
- "Pair with **Retry + Backoff** to avoid hammering a half-recovered downstream."
- "Combine with **Timeout** to set an upper bound on how long the breaker waits."

### 7. Monitoring & Alerting

Provide:
- Metric names to emit on key events (follow `{app_name}.<feature>.<pattern>.<event>` naming)
- Recommended Datadog alert conditions
- Log fields to include on state changes

### 8. Next Steps

List at most 3 concrete actions the developer should take after reading this guide, referencing other `rf_` commands where relevant:

1. ...
2. ...
3. ...

---

## Rules

- Never modify any source file or generate code outside of this response output (advisory only).
- If a pattern is `not yet documented`, offer to add it to the catalog: "Run `/rf_resilient add <pattern_name>` to generate a catalog entry."
- If the user provides an unrecognized pattern name as an argument, list the closest matches from Step 2 and ask for clarification.
- Always read the catalog fresh from disk in Step 1 — do not rely on cached content from a previous run.
- Keep code snippets to ≤ 80 lines; link to the full catalog entry for more detail if needed.
