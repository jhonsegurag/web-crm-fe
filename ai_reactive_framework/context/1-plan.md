# Implementation Plan — web-crm-fe

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

## CRM Modules Overview

| Module | Path | Status | Description |
|--------|------|--------|-------------|
| Home | `/home` | — | Public landing page with features overview |
| Auth | `/login`, `/register` | — | JWT authentication |
| Inbox | `/inbox` | — | Messaging / communication hub |
| Pipeline | `/pipeline` | — | Kanban sales pipeline with stages and deal cards |
| Contacts | `/contacts` | — | CRM contact management |
| Orders | `/orders` | — | Order lifecycle management |
| Catalog | `/catalog` | — | Products and services catalog |
| Map | `/map` | — | Floor/table map for physical locations |
| Agenda | `/agenda` | — | Calendar/scheduling |
| Agent | `/agent` | — | AI assistant integration |
| Labs | `/labs` | — | Experimental features |
| Business | `/business` | — | Business profile and settings |
| Configuration | `/configuration` | — | App-level configuration |
| Blog | `/blog` | Backlog | Public blog/articles page (in requirements, not yet routed) |

---

## Feature Module Implementation Pattern

Every new CRM module follows this vertical slice:

```
1. types/interfaces     → src/app/shared/types/<domain>.types.ts
2. service              → src/app/pages/<module>/<module>.service.ts
3. state (store)        → src/app/store/<module>/
4. routes               → src/app/pages/<module>/<module>.routes.ts
5. list component       → src/app/pages/<module>/<module>-list.component.ts
6. detail component     → src/app/pages/<module>/<module>-detail.component.ts
7. form component       → src/app/pages/<module>/<module>-form.component.ts
8. unit tests           → src/app/pages/<module>/*.spec.ts
```

### Checklist per layer

**Types / Interfaces**
- Pure TypeScript interfaces with no logic.
- Define request/response DTOs matching the web-crm-be API contract.
- Place in `src/app/shared/types/` for cross-module types, or local `*.types.ts` for module-specific ones.

**Service**
- `@Injectable({ providedIn: 'root' })` unless feature-scoped.
- Returns `Observable<T>` — never `Promise` unless wrapping a third-party API.
- Uses `HttpClient` for all API calls.
- Error handling via `catchError` — map to typed error objects; do not swallow errors.
- Never contains UI logic or router calls.

**State (Store)**
- State slices live in `src/app/store/<domain>/`.
- Follow existing store patterns in the codebase.
- Components select state via selectors; dispatch actions for mutations.

**Routes**
- Each module defines its own `*.routes.ts` with a named export (e.g., `INBOX_ROUTES`).
- Use `loadComponent` for leaf routes; `loadChildren` for sub-routed modules.
- Apply `canActivate: [authGuard]` only at the top-level protected parent (already in `app.routes.ts`).

**Components**
- Standalone components (no NgModule).
- Use `ChangeDetectionStrategy.OnPush` for performance.
- Inject services via `inject()` or constructor injection — be consistent within a module.
- Use Angular Material components for UI; never write raw CSS for layout already covered by Material.

**Tests**
- Jest (`jest.config.js`) — not Karma.
- Unit-test services with `HttpClientTestingModule` and `HttpTestingController`.
- Unit-test components with `TestBed.configureTestingModule`.
- Mock services using `jest.fn()` or a manual stub — never rely on actual HTTP calls in unit tests.

---

## Implementation Order

### Phase 1 — Foundation (parallel)
- Auth (login, register, JWT storage, authGuard)
- Core layout (AppLayoutComponent, sidebar navigation)
- HTTP interceptor (token injection + error handling)

### Phase 2 — High-Value Modules (parallel after Phase 1)
- Pipeline (Kanban board, stage management, deal cards)
- Contacts (list, create, edit, view)
- Orders (list, create, status flow)

### Phase 3 — Catalog & Map (parallel)
- Catalog (products/services list, create, edit)
- Map (floor layout, table assignment)

### Phase 4 — Communication & Scheduling (parallel)
- Inbox (message threads, read/unread state)
- Agenda (calendar view, event creation)

### Phase 5 — Advanced (parallel)
- Agent (AI assistant chat interface)
- Labs (experimental features)
- Business (business profile settings)
- Configuration (app settings)

---

## Key Architectural Decisions

**Standalone components (Angular 19).** No `NgModule` declarations. All components use `standalone: true`. Import dependencies directly in `imports: []` within the component decorator.

**Lazy loading for all protected routes.** Every CRM module is loaded on demand. The public routes (home, auth) may be eagerly loaded or use `loadComponent` for consistency.

**authGuard protects the entire app shell.** The `AppLayoutComponent` route uses `canActivate: [authGuard]`. Individual child routes do not repeat the guard — the parent guard is sufficient.

**HTTP interceptor for JWT.** A single interceptor in `core/interceptors/` attaches the JWT to every outgoing request and handles 401 responses by redirecting to login.

**Services are the only HTTP boundary.** Components never call `HttpClient` directly. All API calls go through a service, keeping components testable and decoupled from the transport layer.

**State in `store/`.** Cross-page or cross-component state lives in `src/app/store/`. Component-local state (form state, loading flags) lives in the component itself.

**Pipeline domain.** The Pipeline module manages stages (Kanban columns) and deal cards. Deal cards can be moved between stages via drag-and-drop. The `POST /api/pipeline/orders/{id}/move` endpoint handles position updates.

**Pipeline↔Orders inline integration (`manage-order/service-on-pipeline`).** Each deal card carries an `orderId` reference. From within the Kanban board a user can open the linked order and add, edit, view, or delete its line items without leaving the pipeline view. This is a cross-module feature: the Pipeline module owns the card UI and the move flow; the Orders module owns the order/item form surfaced inside the card. The two modules communicate via shared types (`order.types.ts`) and the Orders service — Pipeline components never call the Orders service directly; they emit an action or navigate to a modal route owned by the Orders module.

---

## Critical Reference Files

| File | Purpose |
|------|---------|
| `src/app/app.routes.ts` | All route definitions; lazy loading wiring |
| `src/app/app.config.ts` | Angular DI providers; HttpClient + interceptor setup |
| `src/app/core/guards/auth.guard.ts` | JWT authentication guard |
| `src/app/core/interceptors/` | HTTP interceptor(s) |
| `src/app/core/layout/app-layout.component.ts` | Authenticated shell with navigation |
| `src/app/store/` | Global state management |
| `src/app/shared/types/` | Shared TypeScript interfaces / DTOs |
| `ai_reactive_framework/context/` | Runtime context files managed by `/rf_*` commands |
| `ai_reactive_framework/flow/` | Feature lifecycle directories |
