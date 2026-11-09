---
name: rf_validate
description: "Validate the feature `$ARGUMENTS` by scanning its source files against 8 quality gates and writing a full report to `ai_reactive_framework/context/report/validation_report.md`."
disable-model-invocation: true
argument-hint: "[feature]"
---

This command is **read-only** — it never modifies source files. It only reads code and writes the report.

---

## Step 1 — Resolve the feature

Check which phase the feature is currently in by looking for its spec file in this order:
1. `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md`
2. `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md`
3. `ai_reactive_framework/flow/4-done/$ARGUMENTS.md`

If none exist, stop and tell the user:
"Feature '$ARGUMENTS' not found in any flow phase. Run /rf_wip $ARGUMENTS first."

Read the spec file found. Extract from the frontmatter: `phase`, `priority`.
Extract from §5: the list of acceptance criteria.
Extract from §6: the API contract (HTTP method, path, request/response shapes, error shape).
Extract from §7: the business rules list.

---

## Step 2 — Discover feature source files

Glob for all Go files related to this feature. Use all of the following patterns in parallel:

- `internal/core/domain/*$ARGUMENTS*.go`
- `internal/core/port/usecase/$ARGUMENTS/*.go`
- `internal/core/port/orchestrator/$ARGUMENTS/*.go`
- `internal/core/port/repository/$ARGUMENTS/*.go`
- `internal/core/usecase/$ARGUMENTS/*.go`
- `internal/core/orchestrator/$ARGUMENTS/*.go`
- `internal/platform/repository/$ARGUMENTS/*.go`
- `internal/platform/metrics/$ARGUMENTS/*.go`
- `cmd/api/routes/handlers/*$ARGUMENTS*.go`
- `cmd/api/routes/dependencies/*.go`

Also glob for test files:
- `internal/core/usecase/$ARGUMENTS/*_test.go`
- `internal/core/orchestrator/$ARGUMENTS/*_test.go`
- `internal/platform/repository/$ARGUMENTS/*_test.go`
- `cmd/api/routes/handlers/*$ARGUMENTS*_test.go`

Read **all** discovered files in parallel. If a file category yields zero results, mark that layer as MISSING in the report.

---

## Step 3 — Run the 8 validation gates

For each gate, evaluate every check against the file contents read in Step 2.
Assign a status to each individual check:

- `PASS` — evidence found in source that satisfies the check
- `FAIL` — evidence found that violates the check, or required pattern is absent
- `WARN` — check cannot be fully verified from static analysis alone (needs runtime or human judgement)
- `N/A`  — check does not apply to this feature (explain why)

### Gate 1 — Architecture Compliance

| # | Check | How to verify |
|---|-------|--------------|
| A1 | Code follows POD layer structure (no layer skipping) | Confirm each layer file exists and imports only its designated dependency |
| A2 | No cross-layer imports (e.g., handler importing `platform/repository` directly) | Grep import blocks in handler files for `platform/repository` |
| A3 | Compile-time interface guard present on every concrete implementation | Search for `var _ port` pattern in usecase, orchestrator, repository files |
| A4 | All required files present: domain, ports (3), usecase, orchestrator, repository, handler, DI | Check file presence from Step 2 discovery |
| A5 | `dependencies/model.go` updated with the new feature fields | Read `cmd/api/routes/dependencies/model.go` and check for feature struct fields |

### Gate 2 — Error Handling

| # | Check | How to verify |
|---|-------|--------------|
| E1 | Repository uses `repoerr.NotFound` / `repoerr.InternalServer` — not raw `errors.New` | Grep repository file for `errors.New` (FAIL if found), `repoerr.` (PASS if found) |
| E2 | UseCase translates repo errors via `ucerr.FromRepositoryError` | Grep usecase file for `ucerr.FromRepositoryError` |
| E3 | Handler calls `HandleError(w, err)` — no raw `http.Error` calls | Grep handler for `http.Error` (FAIL if found), `HandleError` (PASS if found) |
| E4 | No error silently swallowed (`_, err :=` followed by no err check) | Grep all feature files for `_, err :=` or `_, err =` patterns |
| E5 | Error responses never expose internal details | Check that no error message includes stack traces, SQL text, or internal URLs |

### Gate 3 — Security

| # | Check | How to verify |
|---|-------|--------------|
| S1 | No hardcoded secrets, tokens, or credentials | Grep all files for `os.Getenv("SECRET`, `password =`, `token =`, `api_key =` as string literals |
| S2 | User input validated with `validator.Struct()` at handler boundary | Grep handler for `validator.Struct` or `validate.Struct` |
| S3 | No user-controlled input to `http.Get`, `http.Post`, or URL construction | Grep for `http.Get(r.`, `http.Post(r.`, `fmt.Sprintf.*URL.*r.` |
| S4 | No raw SQL with string concatenation | Grep for `fmt.Sprintf.*SELECT`, `fmt.Sprintf.*INSERT`, `fmt.Sprintf.*UPDATE` |
| S5 | No PII in log statements | Grep log calls for field names: `email`, `cpf`, `password`, `token`, `credit_card` |
| S6 | No global mutable state written from handlers or goroutines | Grep for package-level `var` declarations of maps/slices in handler files |
| S7 | No custom security headers set (`Content-Security-Policy`, `CORS`, `HSTS`) | Grep for `Content-Security-Policy`, `Access-Control-Allow`, `Strict-Transport-Security` in handler files |

### Gate 4 — Context Propagation

| # | Check | How to verify |
|---|-------|--------------|
| C1 | `ctx context.Context` is the first parameter in all I/O function signatures | Check function signatures in usecase, orchestrator, repository files |
| C2 | `r.Context()` passed from handler down through all layers | Verify handler passes `r.Context()` to orchestrator call |
| C3 | No `context.Background()` in request paths (only acceptable in `main` and tests) | Grep non-test files for `context.Background()` |

### Gate 5 — Observability

| # | Check | How to verify |
|---|-------|--------------|
| O1 | Request counter instrumented at handler layer | Grep handler for `requests_total` or `RecordRequest` or counter `Add(ctx` |
| O2 | Error counter incremented on every error path | Grep handler/usecase for `errors_total` or `RecordError` on error branches |
| O3 | Latency histogram recorded with `time.Since(start)` | Grep for `time.Since(start)` and histogram `Record(` call |
| O4 | Structured logging used (`log.From(ctx)`) — no `fmt.Printf` or `fmt.Println` in production code | Grep non-test files for `fmt.Printf`, `fmt.Println`, `fmt.Fprintf(os.Stdout` |
| O5 | Log messages include structured fields (feature, operation, etc.) | Grep log calls for at least one structured field key |

### Gate 6 — Testing

| # | Check | How to verify |
|---|-------|--------------|
| T1 | UseCase test file exists | Check `internal/core/usecase/$ARGUMENTS/*_test.go` presence |
| T2 | UseCase tests cover error paths (not just happy path) | Grep usecase test for error scenario table entries or `wantErr` fields |
| T3 | Handler test file exists and verifies HTTP status per error type | Check `cmd/api/routes/handlers/*$ARGUMENTS*_test.go` and grep for `StatusCode` assertions |
| T4 | Repository test covers at least one error case | Grep repository test for error scenario |
| T5 | All mock types have compile-time interface guards | Grep test files for `var _ port` pattern |

### Gate 7 — Code Quality

| # | Check | How to verify |
|---|-------|--------------|
| Q1 | No unused imports | Check import blocks — flag any import not referenced in the file body |
| Q2 | No exported mutable global variables | Grep for `^var [A-Z]` at package level in non-test files |
| Q3 | Constructor functions validate required dependencies | Check `New*` functions for nil checks or compile-time guards on injected deps |
| Q4 | No `panic` in request handlers | Grep handler files for `panic(` |
| Q5 | HTTP clients initialized once and reused (not created per-request) | Check that HTTP client construction is not inside handler method bodies |

### Gate 8 — API Contract

| # | Check | How to verify |
|---|-------|--------------|
| P1 | HTTP method matches operation semantics (no state-changing GET) | Cross-check the HTTP method in the route registration against §6 of the spec |
| P2 | Response struct field names match the spec §6 JSON contract | Compare handler response struct fields to the JSON keys defined in spec §6 |
| P3 | Error responses use `ErrorResponse{Message, Error, Status}` format | Grep handler for the error response struct or `HandleError` usage |
| P4 | HTTP status codes match `handlers/error.go` mapping | Verify no hardcoded status codes bypass `HandleError` |

---

## Step 4 — Detect red flags

Scan all feature files for the following patterns. Each hit is an **automatic FAIL** regardless of gate result:

| Pattern to grep | Severity | Reason |
|----------------|----------|--------|
| `os.Getenv("SECRET` | CRITICAL | Hardcoded secret reference |
| `fmt.Sprintf(.*SELECT.*%s` | CRITICAL | SQL injection |
| `http.Get(r.URL.Query` | CRITICAL | SSRF — user-controlled URL |
| `log.*token.*\+` or `log.*password.*\+` | CRITICAL | Credential exposure in logs |
| `errors.New(` in repository files | HIGH | Bypasses typed error system |
| `panic(` in non-test handler files | HIGH | Crashes entire service on error |
| `var [A-Z][a-zA-Z]* = map` at package level | HIGH | Global mutable state — race condition |
| `context.Background()` in non-main, non-test files | MEDIUM | Context not propagated |

---

## Step 5 — Score and verdict

Count results across all 8 gates:

```
total_checks  = count of all non-N/A checks
passed        = count of PASS
failed        = count of FAIL
warnings      = count of WARN
score         = (passed / (total_checks - warnings)) * 100  [round to 1 decimal]
```

Assign a verdict:

| Score | Red Flags | Verdict |
|-------|-----------|---------|
| ≥ 90% | 0 | APPROVED — ready to proceed to /rf_review |
| 75–89% | 0 | CONDITIONAL — fix FAILs before /rf_review |
| < 75% | any | BLOCKED — must fix all FAILs and red flags |
| any | CRITICAL found | BLOCKED — critical red flags must be resolved first |

---

## Step 6 — Write the report

Create the directory `ai_reactive_framework/context/report/` if it does not exist.

Write the full report to `ai_reactive_framework/context/report/validation_report.md`.

Use exactly this structure:

```
---
feature: $ARGUMENTS
validated_at: <today's date and time>
phase: <phase from Step 1>
priority: <priority from spec frontmatter>
verdict: <APPROVED | CONDITIONAL | BLOCKED>
score: <score>%
passed: <n>
failed: <n>
warnings: <n>
red_flags: <n>
---

# Validation Report — $ARGUMENTS

## Verdict: <APPROVED | CONDITIONAL | BLOCKED>

> Score: <score>% &nbsp;·&nbsp; Passed: <n> &nbsp;·&nbsp; Failed: <n> &nbsp;·&nbsp; Warnings: <n>

---

## Gate 1 — Architecture Compliance

| Check | Status | Evidence |
|-------|--------|----------|
| A1 — POD layer structure | PASS/FAIL/WARN | <file:line or explanation> |
| A2 — No cross-layer imports | PASS/FAIL/WARN | <evidence> |
| A3 — Compile-time guards | PASS/FAIL/WARN | <evidence> |
| A4 — All required files present | PASS/FAIL/WARN | <list of present/missing files> |
| A5 — model.go updated | PASS/FAIL/WARN | <evidence> |

## Gate 2 — Error Handling

| Check | Status | Evidence |
|-------|--------|----------|
| E1 — Repository error types | PASS/FAIL/WARN | <evidence> |
| E2 — ucerr.FromRepositoryError | PASS/FAIL/WARN | <evidence> |
| E3 — HandleError in handler | PASS/FAIL/WARN | <evidence> |
| E4 — No silent swallows | PASS/FAIL/WARN | <evidence> |
| E5 — No internal details exposed | PASS/FAIL/WARN | <evidence> |

## Gate 3 — Security

| Check | Status | Evidence |
|-------|--------|----------|
| S1 — No hardcoded secrets | PASS/FAIL/WARN | <evidence> |
| S2 — Input validation | PASS/FAIL/WARN | <evidence> |
| S3 — No SSRF vectors | PASS/FAIL/WARN | <evidence> |
| S4 — No raw SQL | PASS/FAIL/WARN | <evidence> |
| S5 — No PII in logs | PASS/FAIL/WARN | <evidence> |
| S6 — No global mutable state | PASS/FAIL/WARN | <evidence> |
| S7 — No custom security headers | PASS/FAIL/WARN | <evidence> |

## Gate 4 — Context Propagation

| Check | Status | Evidence |
|-------|--------|----------|
| C1 — ctx first parameter | PASS/FAIL/WARN | <evidence> |
| C2 — r.Context() propagated | PASS/FAIL/WARN | <evidence> |
| C3 — No context.Background() in request path | PASS/FAIL/WARN | <evidence> |

## Gate 5 — Observability

| Check | Status | Evidence |
|-------|--------|----------|
| O1 — Request counter | PASS/FAIL/WARN | <evidence> |
| O2 — Error counter | PASS/FAIL/WARN | <evidence> |
| O3 — Latency histogram | PASS/FAIL/WARN | <evidence> |
| O4 — No fmt.Printf in production | PASS/FAIL/WARN | <evidence> |
| O5 — Structured log fields | PASS/FAIL/WARN | <evidence> |

## Gate 6 — Testing

| Check | Status | Evidence |
|-------|--------|----------|
| T1 — UseCase test exists | PASS/FAIL | <file path or MISSING> |
| T2 — Error path coverage | PASS/FAIL/WARN | <evidence> |
| T3 — Handler HTTP status tests | PASS/FAIL/WARN | <evidence> |
| T4 — Repository error case | PASS/FAIL/WARN | <evidence> |
| T5 — Mock interface guards | PASS/FAIL/WARN | <evidence> |

## Gate 7 — Code Quality

| Check | Status | Evidence |
|-------|--------|----------|
| Q1 — No unused imports | PASS/FAIL/WARN | <evidence> |
| Q2 — No exported mutable globals | PASS/FAIL/WARN | <evidence> |
| Q3 — Constructor nil checks | PASS/FAIL/WARN | <evidence> |
| Q4 — No panic in handlers | PASS/FAIL/WARN | <evidence> |
| Q5 — HTTP clients reused | PASS/FAIL/WARN | <evidence> |

## Gate 8 — API Contract

| Check | Status | Evidence |
|-------|--------|----------|
| P1 — HTTP method semantics | PASS/FAIL/WARN | <evidence> |
| P2 — Response fields match spec | PASS/FAIL/WARN | <evidence> |
| P3 — ErrorResponse format | PASS/FAIL/WARN | <evidence> |
| P4 — No hardcoded status codes | PASS/FAIL/WARN | <evidence> |

---

## Red Flags

<If none found:>
> No red flags detected.

<If found, list each:>
| Severity | Pattern | File | Line | Action Required |
|----------|---------|------|------|----------------|
| CRITICAL | <pattern> | <file> | <line> | <what to fix> |

---

## Action Items

<List every FAIL and red flag as a numbered action item:>

1. **[Gate X — CheckID]** — <specific description of what to fix and how>
2. ...

<If no action items:>
> No action items. All checks passed.

---

## Files Validated

| File | Layer | Status |
|------|-------|--------|
| <path> | <domain/usecase/handler/etc.> | Read / Missing |

---

*Generated by /rf_validate · AI-Reactive Framework*
```

---

## Step 7 — Confirm

Print this summary to the user:

```
✓ Validation complete: $ARGUMENTS
  Report: ai_reactive_framework/context/report/validation_report.md

  Verdict : <APPROVED | CONDITIONAL | BLOCKED>
  Score   : <score>%
  Passed  : <n>/<total> checks
  Failed  : <n>
  Warnings: <n>
  Red flags: <n>

  <If APPROVED:>
  Next: /rf_review $ARGUMENTS

  <If CONDITIONAL:>
  Fix <n> failing check(s) listed in the report, then re-run /rf_validate $ARGUMENTS.

  <If BLOCKED:>
  Resolve all red flags and failing checks before proceeding.
  See: ai_reactive_framework/context/report/validation_report.md
```
