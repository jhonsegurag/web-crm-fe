# Implementation Plan — app-name

## Development Workflow

All features follow the AI-assisted reactive framework lifecycle:

```
1. /rf_to_do      → generate business spec in flow/1-to_do/
2. /rf_wip        → move to active development in flow/2-wip/
3. /rf_implement  → implement feature code from wip spec
4. /rf_review     → move to flow/3-to_review/
5. /rf_done       → merge and archive in flow/4-done/
```

---

## Layer Implementation Pattern

Every new domain feature follows this vertical slice, top to bottom:

```
1. domain struct           → src/api/domain/<domain>/
2. service interface       → src/api/services/<domain>_service.go
3. service implementation  → src/api/services/<domain>_service.go
4. service mock            → src/api/services/<domain>_service_mock.go
5. provider interface      → src/api/providers/<domain>_provider.go
6. provider implementation → src/api/providers/<domain>_provider.go
7. provider mock           → src/api/providers/<domain>_provider_mocks.go
8. Queue client            → src/api/clients/queue/<domain>_queue/
9. controller              → src/api/controllers/<domain>/
10. route registration     → src/api/app/ (server.go or url_mappings)
```

### Checklist per layer

**Domain struct**
- Pure Go structs with JSON tags; no logic, no imports from other layers.
- Redis cache structs live in `domain/cache/`.

**Service**
- Define as interface; assign singleton in `init()`; provide hand-written `*_mock.go`.
- Return `apierrors.ApiError` — never raw `error`.
- Accept `traffic.TrafficContext` as first argument.
- Orchestrate provider calls; do not call queue clients directly from the service layer.

**Provider**
- Use `rest.RequestBuilder` with appropriate timeout and retry settings.
- Call `datadog.IncrementProviderMetric(provider, operation, result)` on every code path.
- Map all error responses via `apierrors.NewApiErrorFromBytes` or explicit error constructors.
- Never mutate shared client fields — pass headers as call parameters.

**Queue Client**
- Implement a publisher interface; provide a NoOp implementation for non-production environments.
- Use `ShouldUseNoOpPublisher()` to select the implementation at startup.
- Clients live in `src/api/clients/queue/<topic>/`.

**Controller**
- Parse and validate the incoming queue message payload.
- Extract traffic context; pass it to the service.
- Return appropriate HTTP status codes (`200`, `400`, `500`).
- Never import providers directly.

**Route registration**
- Register new routes in `src/api/app/`.
- Routes are: `GET /ping`, `POST /queue/resources`, `POST /queue/resources/failed`.

---

## Key Architectural Decisions

**Event-driven, not request-driven.** The service consumes queue messages via HTTP POST endpoints polled by the queue worker. There is no public-facing API or authentication middleware.

**Unidirectional layer dependencies.** Controllers never import providers; services never import controllers. This is a hard rule — violations must be caught in code review.

**Interface-based services and providers.** Every service and provider is an interface. Singletons are assigned in `init()`. Tests replace them with hand-written mock structs — never use reflection-based mocking frameworks.

**NoOp queue publishers in non-production.** `ShouldUseNoOpPublisher()` returns `true` when `GO_ENVIRONMENT` is empty, `dev`, or `local`. This prevents accidental message publishing during local development and testing.

**Redis cache as singleton.** The resource cache is initialized once via `domain/cache/cache_resource.GetInstance()` and reused across the application lifetime.

**Traffic context flows end-to-end.** `traffic.TrafficContext` is extracted once in the controller and passed as a parameter to every downstream service and provider call. It is never re-extracted mid-stack.

**YAML-based configuration.** Scoped config files (`default.yml`, `local.yml`, `test.yml`, `prod.yml`) are loaded at startup. Config dir is auto-resolved from the source path when `CONF_DIR` is not set.

---

## Critical Reference Files

| File | Purpose |
|------|---------|
| `src/api/app/` | Startup and route registrations |
| `src/api/config/config.go` | Typed config accessors for URLs, topics, cache names |
| `src/api/services/resource_service.go` | Main resource processing business logic |
| `src/api/services/resource_failed_service.go` | Failed resource reprocessing business logic |
| `src/api/domain/traffic/` | `TrafficContext` definition — passed through every layer |
| `src/api/domain/cache/` | Redis cache abstraction and resource cache singleton |
| `src/api/clients/queue/` | Queue publisher clients and mocks |
| `src/api/utils/scope_utils/` | `IsProduction()`, `ShouldUseNoOpPublisher()` |
| `src/api/utils/context_utils/` | Request ID, tracing, segment name helpers |
| `ai_reactive_framework/context/` | Runtime context files managed by `/rf_*` commands |
| `ai_reactive_framework/flow/` | Feature lifecycle directories |
