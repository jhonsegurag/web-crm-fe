---
name: rf_test
description: "Generate table-driven unit test files for all layers of feature `$ARGUMENTS` using testify/suite, deriving test cases directly from the spec's acceptance criteria and error cases."
disable-model-invocation: true
argument-hint: "[feature]"
---

This command is **additive** — it never overwrites an existing test file. If a test file already exists, it appends new test cases or skips it and reports what was skipped.

---

## Step 1 — Resolve the feature spec

Locate the spec file in this priority order:
1. `ai_reactive_framework/flow/2-wip/$ARGUMENTS.md`
2. `ai_reactive_framework/flow/3-to_review/$ARGUMENTS.md`
3. `ai_reactive_framework/flow/4-done/$ARGUMENTS.md`
4. `ai_reactive_framework/flow/1-to_do/$ARGUMENTS.md`

If none exist, stop and tell the user:
"Feature '$ARGUMENTS' not found in any flow phase. Run /rf_to_do $ARGUMENTS first."

Read the spec. Extract:
- **§5 Acceptance Criteria** — each checkbox becomes a test case name and assertion
- **§6 API Contract** — HTTP method, path, request/response JSON shape, error shape
- **§9 Error Cases** — each row (Scenario / Error Type / HTTP Status / Message) becomes an error-path test
- **§7 Business Rules** — rules that can be verified in tests become additional assertions

---

## Step 2 — Read project context and discover existing code

Read in parallel:
- `ai_reactive_framework/context/0-context.md` — module name, architecture conventions
- `ai_reactive_framework/4-assisted_code_layer/testing/testing_template.md` — canonical test patterns

Derive `{module}` from the Go module name in `0-context.md` (e.g. `github.com/your-org/your-service`).
Derive `{app_name}` as the last path segment (e.g. `your-service`).

Then glob and read existing source files for this feature:

```
internal/core/domain/*$ARGUMENTS*.go               → extract [Feature] struct name, fields
internal/core/usecase/$ARGUMENTS/service.go         → extract [Operation] method signatures
internal/core/orchestrator/$ARGUMENTS/orchestrator.go → extract [Operation] method signatures
internal/platform/repository/$ARGUMENTS/repository.go → extract [Operation] method + infra deps
cmd/api/routes/handlers/*$ARGUMENTS*.go             → extract handler struct, method, route
internal/core/port/usecase/$ARGUMENTS/*.go          → extract Service interface
internal/core/port/orchestrator/$ARGUMENTS/*.go     → extract Orchestrator interface
internal/core/port/repository/$ARGUMENTS/*.go       → extract Repository interface
```

From the source files, extract the **exact** names to use in tests:
- `[Feature]` — domain struct name (PascalCase)
- `[feature]` — package name (snake_case)
- `[Operation]` — method name on the interface (PascalCase)
- `[FeatureHandler]` — handler struct name
- Request struct name (if the handler decodes a body)

Do NOT invent names. Use only what is found in the source.

---

## Step 3 — Check for existing test files

For each of the 4 test file paths below, check if it already exists:
- `internal/core/usecase/$ARGUMENTS/service_test.go`
- `internal/core/orchestrator/$ARGUMENTS/orchestrator_test.go`
- `cmd/api/routes/handlers/*$ARGUMENTS*_test.go` (glob)
- `internal/platform/repository/$ARGUMENTS/repository_test.go`

If a file already exists:
- Read it.
- Identify which test cases from §5 and §9 are NOT yet covered.
- Append only the missing test functions to the bottom of the existing file.
- Do NOT duplicate existing test functions.

If a file does not exist, generate it in full.

---

## Step 4 — Generate the UseCase test file

Write `internal/core/usecase/$ARGUMENTS/service_test.go`:

Structure:
1. **Package declaration**: `package [feature]_test`
2. **Mock struct** for the Repository port with compile-time interface guard:
   ```go
   var _ port[feature]repo.Repository = (*mock[Feature]Repository)(nil)
   ```
3. **Suite struct** `[Feature]ServiceSuite` embedding `suite.Suite`
4. **Suite runner** `Test[Feature]Service(t *testing.T)`
5. **Happy path test**: table-driven, one row per acceptance criterion in §5 that describes a success outcome
6. **Error path tests**: one test function per row in §9, named `Test[Operation]_[ScenarioInCamelCase]`

Rules for error path tests:
- Each error case from §9 maps to: inject `repoerr.[ErrorType]` → assert `ucerr.[ErrorTypeKey]`
- Use `ucerr.GetError(err)` to assert the error type
- Table entries must use descriptive `name` strings matching the §9 scenario column
- All error types from §9 must be covered — do not omit any

Template pattern (fill from actual names):
```go
package [feature]_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/suite"

    "github.com/your-org/{app_name}/internal/core/domain"
    repoerr  "github.com/your-org/{app_name}/internal/core/error/repository"
    ucerr    "github.com/your-org/{app_name}/internal/core/error/usecase"
    portrepo "github.com/your-org/{app_name}/internal/core/port/repository/$ARGUMENTS"
    "[module]/internal/core/usecase/$ARGUMENTS"
)

type mock[Feature]Repository struct {
    result [ReturnType]
    err    error
}

var _ portrepo.Repository = (*mock[Feature]Repository)(nil)

func (m *mock[Feature]Repository) [Operation](ctx context.Context[, args]) ([ReturnType], error) {
    return m.result, m.err
}

type [Feature]ServiceSuite struct{ suite.Suite }

func Test[Feature]Service(t *testing.T) { suite.Run(t, new([Feature]ServiceSuite)) }

func (s *[Feature]ServiceSuite) Test[Operation]_Success() {
    tests := []struct {
        name     string
        repoData [ReturnType]
        // fields matching §5 acceptance criteria
    }{
        // one entry per §5 success criterion
    }
    for _, tt := range tests {
        s.Run(tt.name, func() {
            svc := $ARGUMENTS.NewService(&mock[Feature]Repository{result: tt.repoData})
            got, err := svc.[Operation](context.Background()[, args])
            s.NoError(err)
            // assertions from §5
        })
    }
}

func (s *[Feature]ServiceSuite) Test[Operation]_Errors() {
    tests := []struct {
        name        string
        repoErr     error
        wantErrType ucerr.ErrorType
    }{
        // one entry per §9 error case
        {name: "[scenario from §9]", repoErr: repoerr.[Type]("[msg]"), wantErrType: ucerr.[TypeKey]},
    }
    for _, tt := range tests {
        s.Run(tt.name, func() {
            svc := $ARGUMENTS.NewService(&mock[Feature]Repository{err: tt.repoErr})
            _, err := svc.[Operation](context.Background()[, args])
            s.Error(err)
            ucErr := ucerr.GetError(err)
            s.Require().NotNil(ucErr)
            s.Equal(tt.wantErrType, ucErr.Type)
        })
    }
}
```

---

## Step 5 — Generate the Orchestrator test file

Write `internal/core/orchestrator/$ARGUMENTS/orchestrator_test.go`:

Structure:
1. **Package**: `package [feature]_test`
2. **Mock** for the UseCase Service port with compile-time guard
3. **Suite** `[Feature]OrchestratorSuite`
4. **Test: delegates success** — verify result passes through unchanged
5. **Test: propagates each error type** — one case per error in §9, verifying the error type is not swallowed

Template pattern:
```go
package [feature]_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/suite"

    "github.com/your-org/{app_name}/internal/core/domain"
    ucerr  "github.com/your-org/{app_name}/internal/core/error/usecase"
    portuc "github.com/your-org/{app_name}/internal/core/port/usecase/$ARGUMENTS"
    "[module]/internal/core/orchestrator/$ARGUMENTS"
)

type mock[Feature]Service struct {
    result [ReturnType]
    err    error
}

var _ portuc.Service = (*mock[Feature]Service)(nil)

func (m *mock[Feature]Service) [Operation](ctx context.Context[, args]) ([ReturnType], error) {
    return m.result, m.err
}

type [Feature]OrchestratorSuite struct{ suite.Suite }

func Test[Feature]Orchestrator(t *testing.T) { suite.Run(t, new([Feature]OrchestratorSuite)) }

func (s *[Feature]OrchestratorSuite) Test[Operation]_DelegatesSuccessfully() {
    expected := [example result from §6 response shape]
    orch := $ARGUMENTS.NewOrchestrator(&mock[Feature]Service{result: expected})
    got, err := orch.[Operation](context.Background()[, args])
    s.NoError(err)
    s.Equal(expected, got)
}

func (s *[Feature]OrchestratorSuite) Test[Operation]_PropagatesErrors() {
    tests := []struct {
        name        string
        svcErr      error
        wantErrType ucerr.ErrorType
    }{
        // one entry per §9 error case
        {name: "[scenario]", svcErr: ucerr.[Type]("[msg]"), wantErrType: ucerr.[TypeKey]},
    }
    for _, tt := range tests {
        s.Run(tt.name, func() {
            orch := $ARGUMENTS.NewOrchestrator(&mock[Feature]Service{err: tt.svcErr})
            _, err := orch.[Operation](context.Background()[, args])
            s.Error(err)
            ucErr := ucerr.GetError(err)
            s.Require().NotNil(ucErr)
            s.Equal(tt.wantErrType, ucErr.Type)
        })
    }
}
```

---

## Step 6 — Generate the Handler test file

Write `cmd/api/routes/handlers/[feature]_test.go` (use the exact filename pattern from Step 2):

Structure:
1. **Package**: `package handlers_test`
2. **Mock** for the Orchestrator port with compile-time guard
3. **Suite** `[Feature]HandlerSuite`
4. **Success test**: verify 200 status + response body matches §6 response shape
5. **Error tests**: one test function per row in §9 — verify the exact HTTP status code from the §9 table
6. If the handler decodes a request body (§6 has a Request section): add a **bad request test** with an invalid/missing body

Test cases must cover every HTTP status listed in §9. Use `httptest.NewRecorder()` and `httptest.NewRequest()`. Decode the response body and assert against `handlers.ErrorResponse{Error, Status}`.

Template pattern:
```go
package handlers_test

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/suite"

    "github.com/your-org/{app_name}/cmd/api/routes/handlers"
    "github.com/your-org/{app_name}/internal/core/domain"
    ucerr    "github.com/your-org/{app_name}/internal/core/error/usecase"
    portorch "github.com/your-org/{app_name}/internal/core/port/orchestrator/$ARGUMENTS"
)

type mock[Feature]Orchestrator struct {
    result [ReturnType]
    err    error
}

var _ portorch.Orchestrator = (*mock[Feature]Orchestrator)(nil)

func (m *mock[Feature]Orchestrator) [Operation](ctx context.Context[, args]) ([ReturnType], error) {
    return m.result, m.err
}

type [Feature]HandlerSuite struct{ suite.Suite }

func Test[Feature]Handler(t *testing.T) { suite.Run(t, new([Feature]HandlerSuite)) }

func (s *[Feature]HandlerSuite) Test[Operation]_Returns200() {
    expected := [example result]
    h := handlers.New[Feature]Handler(&mock[Feature]Orchestrator{result: expected})
    req := httptest.NewRequest(http.Method[METHOD], "/[path]", nil)
    rec := httptest.NewRecorder()
    err := h.[Operation](rec, req)
    s.NoError(err)
    s.Equal(http.StatusOK, rec.Code)
    var got [ReturnType]
    s.Require().NoError(json.NewDecoder(rec.Body).Decode(&got))
    s.Equal(expected, got)
}

// One test per §9 error case — e.g.:
func (s *[Feature]HandlerSuite) Test[Operation]_Returns404OnNotFound() {
    h := handlers.New[Feature]Handler(&mock[Feature]Orchestrator{err: ucerr.NotFound("[feature] not found")})
    req := httptest.NewRequest(http.Method[METHOD], "/[path]", nil)
    rec := httptest.NewRecorder()
    err := h.[Operation](rec, req)
    s.NoError(err)
    s.Equal(http.StatusNotFound, rec.Code)
    var resp handlers.ErrorResponse
    s.Require().NoError(json.NewDecoder(rec.Body).Decode(&resp))
    s.Equal("not_found_error", resp.Error)
    s.Equal(http.StatusNotFound, resp.Status)
}
```

Generate one test function per distinct HTTP status code in §9 (404, 400, 401, 403, 424, 500, etc.).

---

## Step 7 — Generate the Repository test file

Write `internal/platform/repository/$ARGUMENTS/repository_test.go`:

Structure:
1. **Package**: `package [feature]_test`
2. **Suite** `[Feature]RepositorySuite` with `SetupTest` and `TearDownTest` stubs
3. **Happy path test**: instantiate `NewRepository()` and call `[Operation]`, verify no error + non-nil result
4. **Error path stubs**: add one `// TODO` commented test stub per §9 infrastructure error (e.g. timeout, not found from upstream HTTP call). Do NOT write production HTTP mocks — leave stubs with a clear comment: `// TODO: inject HTTP test server to simulate [error]`

Template pattern:
```go
package [feature]_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/suite"

    "[module]/internal/platform/repository/$ARGUMENTS"
)

type [Feature]RepositorySuite struct{ suite.Suite }

func Test[Feature]Repository(t *testing.T) { suite.Run(t, new([Feature]RepositorySuite)) }

func (s *[Feature]RepositorySuite) SetupTest() {
    // Initialize per-test state (HTTP test server, in-memory store, etc.)
}

func (s *[Feature]RepositorySuite) TearDownTest() {
    // Clean up after each test
}

func (s *[Feature]RepositorySuite) Test[Operation]_ReturnsData() {
    repo := $ARGUMENTS.NewRepository()
    got, err := repo.[Operation](context.Background()[, args])
    s.NoError(err)
    s.NotNil(got)
}

// TODO: Test[Operation]_ReturnsNotFoundError — inject HTTP test server returning 404
// TODO: Test[Operation]_ReturnsInternalErrorOnTimeout — inject HTTP test server with timeout
```

---

## Step 8 — Map acceptance criteria to tests

After writing all files, create a coverage mapping table. For each item in §5:

| §5 Criterion | Covered by | File |
|-------------|-----------|------|
| [criterion text] | `Test[Operation]_Success / [case name]` | `service_test.go` |
| [criterion text] | `Test[Operation]_Returns200` | `[feature]_test.go` |
| [criterion text] | PARTIAL — needs manual expansion | — |
| [criterion text] | NOT COVERED — requires integration test | — |

Flag any criterion that cannot be covered by a unit test (e.g. requires a live database, external API, or multi-service coordination) with `NOT COVERED — requires integration test`.

---

## Step 9 — Confirm

Print this summary to the user:

```
✓ Test files generated: $ARGUMENTS

  Files written:
  internal/core/usecase/$ARGUMENTS/service_test.go           [NEW | UPDATED]
  internal/core/orchestrator/$ARGUMENTS/orchestrator_test.go [NEW | UPDATED]
  cmd/api/routes/handlers/[feature]_test.go                  [NEW | UPDATED]
  internal/platform/repository/$ARGUMENTS/repository_test.go [NEW | UPDATED]

  Test coverage summary:
  UseCase        : <n> success cases · <n> error path cases
  Orchestrator   : delegation test · <n> error propagation cases
  Handler        : <n> HTTP status cases (200[, 400, 401, 403, 404, 424, 500])
  Repository     : happy path · <n> TODO stubs for error paths

  §5 Acceptance criteria coverage: <n>/<total> covered by unit tests
  Uncovered (need integration tests): <list if any>

  Run tests:
  go test ./internal/core/usecase/$ARGUMENTS/... -race -v
  go test ./internal/core/orchestrator/$ARGUMENTS/... -race -v
  go test ./cmd/api/routes/handlers/... -race -v
  go test ./internal/platform/repository/$ARGUMENTS/... -race -v

  Or all at once:
  go test ./... -race -cover
```
