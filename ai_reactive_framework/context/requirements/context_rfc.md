# RFC: app-name — Service Architecture

## Overview

**app-name** is a Go event-driven microservice that consumes resource messages from a **message queue**, processes resource state transitions, and publishes results back to queue topics. It is not a public-facing API — it handles asynchronous resource events internally within the organization's infrastructure.

---

## Architecture

### Execution Model

Messages arrive as HTTP POST calls from the queue worker and flow through a strict unidirectional layered stack. Each layer has a single responsibility; dependencies only point inward.

```
HTTP POST /queue/resources  (queue feed)
      ↓
Controller (parse & validate queue message)
      ↓
Service (orchestrate business logic)
      ↓
Providers (fetch users, resources, shipments, applications)
      ↓
Clients/Queue (publish to output topics)
      ↓
Clients/Telemetry (record Datadog metrics)
```

---

## Layers

### 1. `Router` — `src/api/app/`
- **Role:** Route registration and server startup
- **Goal:** Expose the three endpoints consumed by the queue worker. No auth middleware.
- **Routes:**
  - `GET /ping` — health check
  - `POST /queue/resources` — main resource processing feed
  - `POST /queue/resources/failed` — failed resources reprocessing feed

### 2. `Controller` — `src/api/controllers/`
- **Role:** HTTP handler
- **Goal:** Parse and validate the incoming queue message payload, extract traffic context, call the service layer, and write HTTP responses.
- **Notes:** Never imports providers directly. Returns `200`/`400`/`500`.

### 3. `Service` — `src/api/services/`
- **Role:** Business logic
- **Goal:** Orchestrate provider calls, apply resource transition rules, and coordinate publishing to output queue topics.
- **Key files:** `resource_service.go`, `resource_failed_service.go`
- **Notes:** Defined as interfaces with `init()`-initialized singletons. `*_mock.go` files exist for every service interface. Inject mocks in tests by assigning `services.XxxService = &XxxServiceMock{...}`.

### 4. `Provider` — `src/api/providers/`
- **Role:** External HTTP client
- **Goal:** Call internal APIs via `rest.RequestBuilder`, map API responses to domain structs, and emit provider-level Datadog metrics.
- **Notes:** Provider mocks live in `*_mocks.go` files alongside real implementations.

### 5. `Clients` — `src/api/clients/`
- **Role:** Infrastructure clients
- **Goal:** Abstract queue publishing, audit logging, telemetry, and structured logging.
- **Subdirectories:**
  - `queue/` — queue publisher clients with NoOp fallback
  - `audits/` — Audit trail client
  - `telemetry/` — Datadog metric recording
  - `datadog/` — Datadog client wrapper
  - `log/` — `LoggerCollector` backed by `platform-go-core/pkg/log`

---

## Key Patterns

### Dependency Injection via Package-Level Singletons

```go
var ResourceService resourceServiceInterface
func init() { ResourceService = &resourceService{} }
```

Swap in tests: `services.ResourceService = &ResourceServiceMock{...}`

### Traffic Context Propagation

`traffic.TrafficContext` is passed through every layer. It carries the Go context, caller info, and tracing metadata. Controllers extract it once and pass it to every downstream call.

### Error Handling

All functions return `apierrors.ApiError` (from `platform-go-toolkit-goutils`):

```go
apierrors.NewBadRequestApiError("message")
apierrors.NewInternalServerApiError("message", err)
apierrors.NewNotFoundApiError("message")
```

### NoOp Queue Publisher

```go
if utils.ShouldUseNoOpPublisher() {
    publisher = &NoOpPublisher{}
} else {
    publisher = &queuePublisher{}
}
```

`ShouldUseNoOpPublisher()` returns `true` when `GO_ENVIRONMENT` is empty, `dev`, or `local`.

### Redis Cache

Resource cache is initialized as a singleton:

```go
cache := cache_resource.GetInstance()
```

Defined in `src/api/domain/cache/`.

### Datadog Metrics

- Providers: `datadog.IncrementProviderMetric(provider, operation, result)`
- Services/Controllers: via `clients/telemetry/` metric collector

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Go | 1.25.0 |
| HTTP framework | Gin | — |
| Platform | Internal PaaS | v5.1.3 |
| Queue client | `platform-go-toolkit-queue` | v1.10.0 |
| Cache | `platform-go-toolkit-cache` (Redis) | v0.10.2 |
| REST client | `platform-go-toolkit-restful` | v1.0.4 |
| Error types | `platform-go-toolkit-goutils/apierrors` | — |
| Audit logging | `platform-go-toolkit-audits` | v1.3.0 |
| Tracing | `platform-go-toolkit-tracing` + OpenTelemetry | — |
| Observability | Datadog | — |
| Shared domain models | `platform-domain-libs` | v1.16.2 |
| Config loader | `olebedev/config` | — |

---

## Key Directories

| Path | Purpose |
|------|---------|
| `src/api/app/` | Startup (`server.go`) and route definitions |
| `src/api/controllers/` | HTTP handlers: queue message parsing, response writing |
| `src/api/services/` | Business logic; `resource_service.go`, `resource_failed_service.go` |
| `src/api/providers/` | External REST calls (users, resources, shipments, applications) |
| `src/api/clients/queue/` | Queue publisher clients and mocks |
| `src/api/clients/audits/` | Audit trail client |
| `src/api/clients/telemetry/` | Datadog metric recording |
| `src/api/clients/log/` | Structured logger wrapper |
| `src/api/domain/` | Pure Go structs with JSON tags; no logic |
| `src/api/domain/cache/` | Redis cache abstraction and resource cache singleton |
| `src/api/domain/logger/` | `LoggerCollector` interface definition |
| `src/api/domain/metrics/` | Metric collector abstraction |
| `src/api/config/` | YAML config loader; typed getters for URLs, topics, cache names |
| `src/api/utils/scope_utils/` | `IsProduction()`, `ShouldUseNoOpPublisher()`, etc. |
| `src/api/utils/context_utils/` | Request ID, tracing, segment name helpers |

---

## Configuration System

Config is loaded from YAML files in `configs/` at startup via `github.com/olebedev/config`:

| File | Used when |
|------|-----------|
| `configs/default.yml` | Always loaded as the base |
| `configs/local.yml` | `SCOPE=local` |
| `configs/test.yml` | `SCOPE=test` |
| `configs/prod.yml` | `SCOPE=prod` |

Config dir resolved from `CONF_DIR` env var, falling back to source-relative path via `scopeutil.GetAbsPathConfigDir()`.

**Key config accessors (`src/api/config/config.go`):**

| Function | YAML key | Description |
|----------|----------|-------------|
| `GetBaseInternalURL()` | `rest-clients.base-internal-url` | Internal base URL |
| `GetInternalSystemsBaseURL(name)` | `rest-clients.base-internal-systems-url` | Format: `https://%s.internal-systems.example.com` |
| `GetInternalOfficeBaseURL(name)` | `rest-clients.base-internal-office-url` | Format: `https://%s.internal-office.example.com` |
| `GetBaseSystemURL(name)` | — | Returns systems URL in prod, office URL otherwise |
| `GetResourcesFeedTopic()` | `queues.resources-feed.topic-name` | Queue topic for the resources feed |
| `GetResourceTransitionFeedTopic()` | `queues.resource-transition.topic-name` | Queue topic for resource transitions |
| `GetResourcesFailedFeedTopic()` | `queues.resources-failed.topic-name` | Queue topic for failed resources |
| `GetResourcesCache()` | `caches.resources.cache-name` | Redis cache name for resources |
| `IsProduction()` | — | Delegates to `scopeutil.IsProduction()` |

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SCOPE` | — | `local`/`test`/`prod` — selects YAML overlay |
| `GO_ENVIRONMENT` | — | `production` enables production mode; `local`/`dev`/empty uses NoOp queue publishers |
| `CONF_DIR` | auto | Path to `configs/`; auto-resolved from source path if unset |
| `PORT` | `:8080` | HTTP listen port |
| `LOGGER_LEVEL` | `INFO` | Log verbosity |
| `DATACENTER` | `AWS` | Infrastructure datacenter |
