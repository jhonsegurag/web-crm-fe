---
feature: pipeline-orders-integration
phase: wip
wip_started: 2026-11-09
priority: P0
created: 2026-11-09
source: ai_reactive_framework/context/1-plan.md
---

# Business Specification — Pipeline ↔ Orders Inline Integration

---

## 1. Objective

This feature delivers inline order management from within a Kanban deal card on the Pipeline board. Each deal card carries an `orderId` reference; when a user clicks the order slot on a card, an order panel opens — without navigating away from the pipeline — where they can view the linked order's details and add, edit, or delete its line items (products/services). The goal is to remove the context switch of leaving the pipeline view to manage an order, keeping the sales workflow contained in a single screen. Business users (sales reps, managers) are the primary beneficiaries. This is the web-crm-fe half of the `manage-order/service-on-pipeline` requirement from `fluvo-rfc.md`.

---

## 2. Scope

| In scope | Out of scope |
|----------|-------------|
| Order panel UI embedded in / triggered from the deal card | Creating or editing the deal card itself (owned by Pipeline module) |
| Viewing linked order details (channel, contact, table, notes) | Moving deal cards between stages (owned by Pipeline board) |
| Adding order line items (product, quantity, notes) | Product/catalog CRUD (owned by Catalog module) |
| Editing existing order line items | Full order lifecycle management (owned by Orders module standalone pages) |
| Deleting order line items | Direct calls to OrdersService from Pipeline components |
| Shared `order.types.ts` consumed by both Pipeline and Orders modules | Backend API implementation (owned by web-crm-be) |

---

## 3. Actors

| Actor | Description |
|-------|-------------|
| Authenticated User (Sales Rep / Manager) | Opens deal card, interacts with order panel to view/manage line items |
| Deal Card Component | Owns the `orderId` reference and opens the order panel on user action |
| Order Panel Component | Displays order details and delegates item mutations to OrdersService |
| OrdersService | The only component that calls the backend order API; owned by the Orders module |
| web-crm-be REST API | Provides order and order-item endpoints consumed via OrdersService |

---

## 4. User Stories

```
AS A sales rep
I WANT TO manage the order linked to a deal card from within the pipeline view
SO THAT I can update what products are on an order without losing my place on the board
```

### Story 1 — View order details from a deal card

**Given** I am on the Pipeline board and a deal card has an `orderId` assigned  
**When** I click the order slot on the deal card  
**Then** an order panel opens inline (drawer or dialog) showing the order details (channel, contact, table, notes) and its current line items  

### Story 2 — Add a line item to the order

**Given** the order panel is open for a deal card  
**When** I fill in a product, quantity, and optional notes and submit the add-item form  
**Then** the new line item is saved via OrdersService and appears in the panel's item list without closing the panel  

### Story 3 — Remove a line item from the order

**Given** the order panel is open and shows existing line items  
**When** I click delete on a line item and confirm  
**Then** the item is removed via OrdersService and the panel updates — the deal card and pipeline board remain unchanged  

---

## 5. Acceptance Criteria

- [ ] **AC-01** — The deal card renders an order-slot affordance when `orderId` is set; clicking it opens the order panel.
- [ ] **AC-02** — The order panel displays order header fields (channel, contactId, tableId, notes) and all line items (productId, quantity, notes) fetched via OrdersService.
- [ ] **AC-03** — A user can submit the add-item form (`productId`, `quantity`, `notes`) and the new item appears in the panel list without full-page navigation.
- [ ] **AC-04** — A user can delete any line item; the item is removed from the list after successful API response.
- [ ] **AC-05** — Pipeline components (`deal-card`, `order-panel`) never import or call OrdersService directly — all order mutations go through the store or a modal route owned by the Orders module.
- [ ] **AC-06** — All components in this feature are standalone (`standalone: true`) and use `ChangeDetectionStrategy.OnPush`.
- [ ] **AC-07** — Unit tests cover: panel opens on card click, item list renders, add-item form submission dispatches correct action/service call, delete triggers confirmation and removal.

---

## 6. API Contract

### Frontend Component Interface

```
Feature entry point: deal-card.component.ts → emits (openOrderPanel) with orderId
Panel host: order-panel.component.ts → receives orderId @Input, calls OrdersService
```

### REST Endpoints (via OrdersService — web-crm-be)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/orders/{orderId}` | GET | Fetch order header + line items |
| `/api/orders/{orderId}/items` | POST | Add a new line item |
| `/api/orders/{orderId}/items/{itemId}` | PUT | Edit an existing line item |
| `/api/orders/{orderId}/items/{itemId}` | DELETE | Remove a line item |

### Add Line Item — Request

```json
{
  "productId": "uuid-of-product",
  "quantity": 2,
  "notes": "Extra sauce"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `productId` | `string (UUID)` | Yes | Must reference a valid catalog product |
| `quantity` | `number` | Yes | Integer ≥ 1 |
| `notes` | `string` | No | Max 500 characters |

### Response — 200 OK (order with items)

```json
{
  "id": "uuid",
  "channel": "in_store",
  "contactId": "uuid",
  "tableId": "uuid",
  "notes": "string",
  "items": [
    { "id": "uuid", "productId": "uuid", "quantity": 2, "notes": "string" }
  ]
}
```

### Response — Error

```json
{
  "message": "human-readable message",
  "error": "error_type_key",
  "status": 404
}
```

---

## 7. Business Rules

| # | Rule | Rationale |
|---|------|-----------|
| BR-01 | Pipeline components must never import or inject `OrdersService` directly | Enforces module boundary; Pipeline owns card/move UI, Orders owns order data |
| BR-02 | All order mutations from the panel must go through `OrdersService` (injected into the panel component or dispatched via store action) | Single HTTP boundary — services are the only layer that calls `HttpClient` |
| BR-03 | `order.types.ts` (Order, OrderItem, OrderStatus) lives in `src/app/shared/types/` and is imported by both Pipeline and Orders modules | Shared DTOs prevent type drift between the two modules |
| BR-04 | Opening the order panel must not trigger router navigation — it must use an in-page panel (Angular Material `MatDrawer` or `MatDialog`) | Keeps the user on the pipeline board; navigation would lose the Kanban scroll state |
| BR-05 | Closing the order panel must leave the deal card and board state unchanged — no refresh of the pipeline board is required | Order item changes do not affect deal card position, stage, or value |

---

## 8. State Transitions

```
Deal card (orderId assigned)
  ──[user clicks order slot]──► Order panel OPEN (loading)
  ──[GET /api/orders/{id} resolves]──► Order panel OPEN (loaded)
  ──[user submits add-item]──► item list UPDATING
  ──[POST resolves]──► item list UPDATED (panel stays open)
  ──[user clicks delete item + confirms]──► item list UPDATING
  ──[DELETE resolves]──► item list UPDATED (panel stays open)
  ──[user closes panel]──► Order panel CLOSED (board unchanged)
```

| From | Trigger | To | Guard condition |
|------|---------|-----|----------------|
| Panel closed | Click order slot on card | Panel open — loading | `orderId` must be set on the card |
| Panel loading | GET order response | Panel open — loaded | HTTP 200 |
| Panel loaded | Submit add-item form | Item list updating | Form valid (`productId` + `quantity` present) |
| Panel loaded | Click delete + confirm | Item list updating | Item ID must exist |
| Any panel state | Close / backdrop click | Panel closed | — |

---

## 9. Error Cases

| Scenario | Error Type | HTTP Status | Message |
|----------|-----------|-------------|---------|
| `orderId` on deal card is null/undefined | `bad_request_error` | 400 | "No order linked to this deal card" |
| Order not found (deleted externally) | `not_found_error` | 404 | "Order not found — it may have been deleted" |
| Add-item with missing `productId` or `quantity` | `bad_request_error` | 400 | "Product and quantity are required" |
| Product not found in catalog | `not_found_error` | 404 | "Selected product does not exist in catalog" |
| Unauthenticated request (token expired) | `unauthorized_error` | 401 | Interceptor redirects to /login |
| Backend unavailable | `failed_dependency_error` | 424 | "Could not reach the server — please retry" |
| Unexpected server error | `internal_server_error` | 500 | "An unexpected error occurred" |

---

## 10. Non-Functional Requirements

| Attribute | Target |
|-----------|--------|
| Latency (p99) | < 500 ms for panel open (GET order); < 300 ms for item add/delete |
| Availability | 99.9% (matches web-crm-be SLA) |
| Throughput | Matches platform service limits |
| Data sensitivity | Non-PII (order items are business data) |
| Change detection | `OnPush` on all new components — no default CD cycles |

---

## 11. Dependencies

| System | Type | Purpose |
|--------|------|---------|
| `OrdersService` (`src/app/pages/orders/orders.service.ts`) | Internal Angular service | Fetches order + items; performs item add / edit / delete via HTTP |
| `src/app/shared/types/order.types.ts` | Shared TypeScript types | `Order`, `OrderItem`, `AddItemRequest` DTOs used by both modules |
| `@angular/material` — `MatDialogModule` or `MatDrawerModule` | npm package ^19.2.19 | Panel/overlay UI for the order panel |
| `web-crm-be` REST API (`/api/orders/*`) | HTTP/REST | Backend persistence for order and line item data |
| `ai_reactive_framework/context/0-context.md` | Embedded context | Angular conventions, DI wiring, module patterns |
| `ai_reactive_framework/1-business_layer/templates/business_rules_template.md` | Template | Spec structure reference |

---

## 12. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| OQ-01 | Should the order panel use `MatDialog` (modal) or `MatDrawer` (side panel)? MatDialog is simpler but MatDrawer keeps the board visible. | — | — |
| OQ-02 | Can a deal card exist without a linked order (`orderId` = null)? If so, should the order panel offer to create a new order, or is order creation always done in the Orders module first? | — | — |
