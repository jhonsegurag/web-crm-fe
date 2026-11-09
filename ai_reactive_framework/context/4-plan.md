---
generated: 2026-11-09
sources:
  - ai_reactive_framework/context/requirements/
  - ai_reactive_framework/context/1-features.md
  - ai_reactive_framework/context/2-dependencies.md
  - ai_reactive_framework/context/3-issues.md
---

═══════════════════════════════════════════════════════
  RF Implementation Plan
═══════════════════════════════════════════════════════

  Tech Stack:   TypeScript · Angular 19 · Angular Material + RxJS
  Architecture: SPA — lazy-loaded feature modules behind authGuard shell

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 IMPLEMENTATION ORDER
  ───────────────────────────────────────────────────────────────────────
  #   Feature                        Priority  Phase    Complexity  Blocker?
  ──────────────────────────────────────────────────────────────────────────
  1   auth                           P0        backlog  high        R1, R4, KB-auth
  2   core-layout                    P0        backlog  high        ISSUE-02
  3   pipeline                       P0        backlog  high        KB-pipeline
  4   pipeline-orders-integration    P0        backlog  medium      —
  5   contacts                       P0        backlog  medium      —
  6   orders                         P0        backlog  medium      —
  7   home                           P1        backlog  low         —
  8   inbox                          P1        backlog  medium      —
  9   catalog                        P1        backlog  medium      —
  10  agenda                         P1        backlog  medium      —
  11  business                       P1        backlog  low         —
  12  configuration                  P1        backlog  low         —
  13  map                            P2        backlog  high        —
  14  agent                          P2        backlog  high        KB-agent
  15  labs                           P2        backlog  low         —
  16  blog                           P2        backlog  low         —

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 FEATURE BREAKDOWN
  ───────────────────────────────────────────────────────────────────────

  [#1] auth  ·  P0  ·  backlog
  ──────────────────────────────────────────
  Objective:      JWT login, register, token storage, authGuard, and
                  HTTP interceptor for all protected routes.
  Layers needed:  types → service → guard → interceptor → components → routes
  Files to create:
    - src/app/shared/types/auth.types.ts               (LoginRequest, AuthToken, User)
    - src/app/pages/auth/auth.service.ts               (login, register, logout, getToken)
    - src/app/core/guards/auth.guard.ts                (token presence + expiry check)
    - src/app/core/interceptors/auth.interceptor.ts    (attach Bearer, handle 401 → /login)
    - src/app/pages/auth/login.component.ts
    - src/app/pages/auth/register.component.ts
  Files to update:
    - src/app/app.config.ts     (register interceptor via withInterceptors)
    - src/app/app.routes.ts     (login/register routes already declared)
  Dependencies:   @angular/forms, @angular/router, rxjs
  Risks:          R1 (localStorage XSS), R4 (token expiry not checked), KB-auth

  [#2] core-layout  ·  P0  ·  backlog
  ──────────────────────────────────────────
  Objective:      Authenticated app shell — AppLayoutComponent with sidebar
                  navigation and header; wraps all protected routes.
  Layers needed:  components → routes
  Files to create:
    - src/app/core/layout/app-layout.component.ts
    - src/app/core/layout/sidebar.component.ts
    - src/app/core/layout/header.component.ts
  Files to update:
    - src/app/app.routes.ts     (AppLayoutComponent already declared as parent)
    - src/environments/         (document API base URL per env — resolves ISSUE-02)
  Dependencies:   @angular/material (MatSidenavModule, MatToolbarModule, MatListModule)
  Risks:          ISSUE-02 (no env API base URL strategy documented)

  [#3] pipeline  ·  P0  ·  backlog
  ──────────────────────────────────────────
  Objective:      Kanban board — stage columns, draggable deal cards,
                  stage CRUD and card move via POST /api/pipeline/orders/{id}/move.
  Layers needed:  types → service → store → routes → components
  Files to create:
    - src/app/shared/types/pipeline.types.ts           (Stage, DealCard, MoveRequest)
    - src/app/pages/pipeline/pipeline.service.ts       (stages CRUD, card CRUD, move)
    - src/app/store/pipeline/                          (state, actions, selectors)
    - src/app/pages/pipeline/pipeline.routes.ts        (PIPELINE_ROUTES)
    - src/app/pages/pipeline/pipeline-board.component.ts
    - src/app/pages/pipeline/pipeline-stage.component.ts
    - src/app/pages/pipeline/deal-card.component.ts   (draggable; exposes orderId slot)
    - src/app/pages/pipeline/deal-form.component.ts
  Files to update:
    - src/app/app.routes.ts   (PIPELINE_ROUTES already wired)
  Dependencies:   @angular/cdk (DragDropModule), @angular/material
  API:            GET/POST /api/pipelines
                  GET/POST /api/pipeline/orders
                  POST /api/pipeline/orders/{id}/move
  Risks:          KB-pipeline (no CDK DragDrop pattern documented), R2

  [#4] pipeline-orders-integration  ·  P0  ·  backlog
  ──────────────────────────────────────────
  Objective:      Inline order management from a deal card — view, add, edit,
                  and delete order line items without leaving the pipeline view
                  (manage-order/service-on-pipeline, web-crm-fe story).
  Layers needed:  types → service (reuse orders) → component
  Files to create:
    - src/app/pages/pipeline/order-panel.component.ts  (order detail panel inside card)
    - src/app/pages/pipeline/order-items-form.component.ts (add/edit line items)
  Files to update:
    - src/app/pages/pipeline/deal-card.component.ts   (open order panel on click)
    - src/app/shared/types/order.types.ts              (Order, OrderItem — shared with orders module)
  Dependencies:   OrdersService (from #6 orders), @angular/material (MatDialogModule or panel)
  Notes:          Pipeline components must NOT call OrdersService directly —
                  emit a store action or use a modal route owned by the Orders module.
  Risks:          R2 (API contract drift between pipeline card and order payloads)

  [#5] contacts  ·  P0  ·  backlog
  ──────────────────────────────────────────
  Objective:      CRM contact management — list, create, edit, view, delete.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/contact.types.ts
    - src/app/pages/contacts/contacts.service.ts
    - src/app/pages/contacts/contacts.routes.ts        (CONTACTS_ROUTES)
    - src/app/pages/contacts/contacts-list.component.ts
    - src/app/pages/contacts/contact-detail.component.ts
    - src/app/pages/contacts/contact-form.component.ts
  Files to update:
    - src/app/app.routes.ts   (CONTACTS_ROUTES already wired)
  Dependencies:   @angular/material (MatTableModule, MatPaginatorModule)
  API:            GET/POST/PUT/DELETE /api/contacts
  Risks:          R2

  [#6] orders  ·  P0  ·  backlog
  ──────────────────────────────────────────
  Objective:      Order lifecycle — create orders with line items, assign to
                  table/location/contact, track order status.
                  Also provides OrdersService reused by pipeline-orders-integration (#4).
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/order.types.ts   (Order, OrderItem, OrderStatus — shared)
    - src/app/pages/orders/orders.service.ts
    - src/app/pages/orders/orders.routes.ts (ORDERS_ROUTES)
    - src/app/pages/orders/orders-list.component.ts
    - src/app/pages/orders/order-detail.component.ts
    - src/app/pages/orders/order-form.component.ts
    - src/app/pages/orders/order-items-list.component.ts
  Files to update:
    - src/app/app.routes.ts   (ORDERS_ROUTES already wired)
  Dependencies:   @angular/material, @angular/forms
  API:            GET/POST /api/orders
  Risks:          R2

  [#7] home  ·  P1  ·  backlog
  ──────────────────────────────────────────
  Objective:      Public landing page — menu, hero slide, features section
                  (Inbox, Pipeline, Contacts, Catalog, Map, AI Assistant), footer.
  Layers needed:  components → route
  Files to create:
    - src/app/pages/home/home.component.ts
    - src/app/pages/home/home.component.html
    - src/app/pages/home/home.component.scss
  Files to update:
    - src/app/app.routes.ts   (home route already declared)
  Dependencies:   @angular/material (MatButtonModule), @angular/router
  Risks:          none

  [#8] inbox  ·  P1  ·  backlog
  ──────────────────────────────────────────
  Objective:      Messaging hub — conversation threads with read/unread state
                  and message send.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/inbox.types.ts
    - src/app/pages/inbox/inbox.service.ts
    - src/app/pages/inbox/inbox.routes.ts    (INBOX_ROUTES)
    - src/app/pages/inbox/inbox-list.component.ts
    - src/app/pages/inbox/thread.component.ts
  Files to update:
    - src/app/app.routes.ts   (INBOX_ROUTES already wired)
  Dependencies:   @angular/material (MatListModule, MatBadgeModule)
  Risks:          R2

  [#9] catalog  ·  P1  ·  backlog
  ──────────────────────────────────────────
  Objective:      Products and services catalog — list, create, edit, delete.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/catalog.types.ts   (Product, Service, CatalogItem)
    - src/app/pages/catalog/catalog.service.ts
    - src/app/pages/catalog/catalog.routes.ts (CATALOG_ROUTES)
    - src/app/pages/catalog/catalog-list.component.ts
    - src/app/pages/catalog/catalog-form.component.ts
  Files to update:
    - src/app/app.routes.ts   (CATALOG_ROUTES already wired)
  Dependencies:   @angular/material, @angular/forms
  API:            GET/POST/PUT/DELETE /api/catalog
  Risks:          R2

  [#10] agenda  ·  P1  ·  backlog
  ──────────────────────────────────────────
  Objective:      Calendar/scheduling — view events by day/week/month,
                  create and edit appointments.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/agenda.types.ts
    - src/app/pages/agenda/agenda.service.ts
    - src/app/pages/agenda/agenda.routes.ts   (AGENDA_ROUTES)
    - src/app/pages/agenda/agenda.component.ts
  Files to update:
    - src/app/app.routes.ts   (AGENDA_ROUTES already wired)
  Dependencies:   @angular/material (MatDatepickerModule, MatNativeDateModule)
  Risks:          none

  [#11] business  ·  P1  ·  backlog
  ──────────────────────────────────────────
  Objective:      Business profile — name, contact info, branding settings.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/pages/business/business.service.ts
    - src/app/pages/business/business.routes.ts   (BUSINESS_ROUTES)
    - src/app/pages/business/business.component.ts
  Files to update:
    - src/app/app.routes.ts   (BUSINESS_ROUTES already wired)
  Dependencies:   @angular/material, @angular/forms
  Risks:          none

  [#12] configuration  ·  P1  ·  backlog
  ──────────────────────────────────────────
  Objective:      App-level configuration — user roles, integrations, preferences.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/pages/configuration/configuration.service.ts
    - src/app/pages/configuration/configuration.routes.ts  (CONFIGURATION_ROUTES)
    - src/app/pages/configuration/configuration.component.ts
  Files to update:
    - src/app/app.routes.ts   (CONFIGURATION_ROUTES already wired)
  Dependencies:   @angular/material, @angular/forms
  Risks:          none

  [#13] map  ·  P2  ·  backlog
  ──────────────────────────────────────────
  Objective:      Visual floor plan — place and label tables, assign orders
                  to tables and locations.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/map.types.ts       (Floor, Table, Location)
    - src/app/pages/map/map.service.ts
    - src/app/pages/map/map.routes.ts         (MAP_ROUTES)
    - src/app/pages/map/map-canvas.component.ts
    - src/app/pages/map/table-item.component.ts
  Files to update:
    - src/app/app.routes.ts   (MAP_ROUTES already wired)
  Dependencies:   @angular/cdk (DragDropModule for table positioning)
  Risks:          KL-2 (no map library — requires custom canvas or CDK solution)

  [#14] agent  ·  P2  ·  backlog
  ──────────────────────────────────────────
  Objective:      AI assistant chat interface — send prompts, receive streamed
                  or batch responses.
  Layers needed:  types → service → routes → components
  Files to create:
    - src/app/shared/types/agent.types.ts
    - src/app/pages/agent/agent.service.ts
    - src/app/pages/agent/agent.routes.ts    (AGENT_ROUTES)
    - src/app/pages/agent/agent-chat.component.ts
  Files to update:
    - src/app/app.routes.ts   (AGENT_ROUTES already wired)
  Dependencies:   rxjs (streaming response handling)
  Risks:          KB-agent (AI API contract undefined), KL-3 (integration TBD)

  [#15] labs  ·  P2  ·  backlog
  ──────────────────────────────────────────
  Objective:      Experimental sandbox for new features before promotion.
  Layers needed:  routes → components
  Files to create:
    - src/app/pages/labs/labs.routes.ts      (LABS_ROUTES)
    - src/app/pages/labs/labs.component.ts
  Files to update:
    - src/app/app.routes.ts   (LABS_ROUTES already wired)
  Dependencies:   none
  Risks:          none

  [#16] blog  ·  P2  ·  backlog
  ──────────────────────────────────────────
  Objective:      Public blog/articles page — dynamic article grid.
                  In requirements (fluvo-rfc.md) but no route defined yet.
  Layers needed:  types → service → component → route
  Files to create:
    - src/app/shared/types/blog.types.ts
    - src/app/pages/blog/blog.service.ts
    - src/app/pages/blog/blog.component.ts
  Files to update:
    - src/app/app.routes.ts   (add /blog public route — not yet declared)
  Dependencies:   @angular/material (MatCardModule)
  Risks:          none

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 DEPENDENCY READINESS
  ───────────────────────────────────────────────────────────────────────
  Package / Service                   Status        Required by
  ─────────────────────────────────────────────────────────────────────
  @angular/core ^19.2.0               ✓ resolved    all features
  @angular/router ^19.2.0             ✓ resolved    all features
  @angular/forms ^19.2.0              ✓ resolved    auth, orders, catalog, agenda, business, configuration
  @angular/material ^19.2.19          ✓ resolved    all UI features
  @angular/cdk ^19.2.19               ✓ resolved    pipeline (#3), map (#13)
  rxjs ~7.8.0                         ✓ resolved    all services
  OrdersService (orders module #6)    ✗ pending     pipeline-orders-integration (#4)
  web-crm-be API base URL (per env)   ✗ missing     auth, pipeline, contacts, orders, catalog, inbox, agenda, business

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ BLOCKERS & RISKS
  ───────────────────────────────────────────────────────────────────────
  [HIGH]   R1       — JWT stored in localStorage is vulnerable to XSS
    Affects: auth (#1)
    Action:  Audit all DomSanitizer.bypassSecurityTrust* usage; plan
             httpOnly cookie migration for future hardening.

  [MEDIUM] R2       — web-crm-be API contract changes break frontend silently
    Affects: pipeline (#3), pipeline-orders-integration (#4), contacts (#5),
             orders (#6), inbox (#8), catalog (#9)
    Action:  Define TypeScript interfaces in shared/types/ for every response
             shape before implementing each service.

  [MEDIUM] R4       — authGuard only checks token presence, not expiry
    Affects: auth (#1), core-layout (#2)
    Action:  Decode JWT exp claim in authGuard; handle 401 in interceptor
             by clearing token and redirecting to /login.

  [MEDIUM] ISSUE-02 — No env strategy for web-crm-be API base URL
    Affects: core-layout (#2), all API-dependent features
    Action:  Document environment.ts values for dev/prod API base URL
             before wiring HttpClient in app.config.ts.

  [LOW]    KB-pipeline — No CDK DragDrop pattern documented for deal cards
    Affects: pipeline (#3)
    Action:  Document @angular/cdk DragDropModule usage pattern before
             implementing the Kanban board.

  [LOW]    KB-agent — AI assistant API contract undefined
    Affects: agent (#14)
    Action:  Define AI backend endpoint contract before starting agent module.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 NEXT STEPS
  ───────────────────────────────────────────────────────────────────────
  1. Resolve ISSUE-02        — document API base URL in src/environments/
                               before wiring any HTTP service
  2. /rf_to_do auth          — spec for login, register, guard, interceptor
  3. /rf_to_do core-layout   — spec for AppLayoutComponent + sidebar
  4. /rf_to_do pipeline      — spec for Kanban board (after auth ships)

═══════════════════════════════════════════════════════
