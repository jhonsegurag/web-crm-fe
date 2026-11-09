# Implementation Plan — <project_name>

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
1. <domain type>              → <path>/<domain>/
2. <service interface>        → <path>/<domain>_service.<ext>
3. <service implementation>   → <path>/<domain>_service.<ext>
4. <service mock>             → <path>/<domain>_service_mock.<ext>
5. <provider/adapter interface>      → <path>/<domain>_provider.<ext>
6. <provider/adapter implementation> → <path>/<domain>_provider.<ext>
7. <provider/adapter mock>           → <path>/<domain>_provider_mocks.<ext>
8. <messaging/queue client, if any>  → <path>/<domain>_queue/
9. <controller/handler>       → <path>/<domain>/
10. <route/registration>      → <path> (<file or mechanism>)
```

<!-- Adjust the number and names of steps to match the project's actual layers (e.g. drop the queue client step for request/response services, or add a repository layer for CRUD-style services). -->

### Checklist per layer

**<Domain type>**
- <structural rule, e.g. "pure structs; no logic, no imports from other layers">.
- <where shared/cache structs live, if applicable>.

**<Service>**
- <interface/implementation convention>.
- <error handling convention — how errors are returned>.
- <what context/metadata must be threaded through, if any>.
- <what the service may/may not call directly>.

**<Provider / Adapter>**
- <HTTP client / DB client convention, e.g. timeout and retry settings>.
- <metrics convention — what must be recorded on every code path>.
- <error mapping convention>.
- <mutation rule — e.g. never mutate shared client fields>.

**<Messaging/Queue Client>** <!-- omit if the project has no async messaging -->
- <publisher/consumer interface convention>.
- <how non-production environments are handled, e.g. NoOp implementation>.
- <where clients live>.

**<Controller/Handler>**
- <input parsing and validation convention>.
- <what context/metadata must be extracted and passed down>.
- <response/status code convention>.
- <import rule — e.g. never import the provider layer directly>.

**<Route registration>**
- <where new routes/endpoints are registered>.
- <list of existing routes as a reference, e.g. `GET /ping`>.

---

## Key Architectural Decisions

**<Decision name, e.g. "Event-driven, not request-driven">.** <One or two sentences explaining the decision and its consequence.>

**<Decision name, e.g. "Unidirectional layer dependencies">.** <Explanation and the enforcement rule, e.g. "must be caught in code review">.

**<Decision name, e.g. "Interface-based services and providers">.** <Explanation of the abstraction and testing convention.>

**<Decision name, e.g. "NoOp publishers in non-production">.** <Explanation of when/why the no-op path is used.>

**<Decision name, e.g. "Cache as singleton">.** <Explanation of the caching strategy.>

**<Decision name, e.g. "Context/metadata flows end-to-end">.** <Explanation of how request-scoped data propagates.>

**<Decision name, e.g. "Configuration strategy">.** <Explanation of how and when config is loaded.>

---

## Critical Reference Files

| File | Purpose |
|------|---------|
| `<path>` | <purpose, e.g. "Startup and route registrations"> |
| `<path>` | <purpose, e.g. "Typed config accessors"> |
| `<path>` | <purpose, e.g. "Main business logic for <domain>"> |
| `<path>` | <purpose> |
| `<path>` | <purpose> |
| `<path>` | <purpose> |
| `ai_reactive_framework/context/` | Runtime context files managed by `/rf_*` commands |
| `ai_reactive_framework/flow/` | Feature lifecycle directories |
