# Project Context — web-crm-fe

## Module

```
web-crm-fe (npm package)
```

## Purpose

**web-crm-fe** is an Angular 19 Single Page Application for managing a business CRM. It provides a full-featured frontend for controlling business operations including inbox messaging, sales pipeline, contacts, catalog (products/services), floor/table map, orders, agenda, agent assistant, labs, and configuration.

The frontend communicates with **web-crm-be** (Node.js/Next.js + MySQL/Sequelize backend) over a REST API. Authentication uses JWT stored locally and enforced via an Angular route guard.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | ~5.7.2 |
| Framework | Angular | ^19.2.0 |
| UI components | Angular Material + CDK | ^19.2.19 |
| Reactive primitives | RxJS | ~7.8.0 |
| State management | Angular store (`store/`) | — |
| Testing | Jest + jest-preset-angular | ^29.7.0 |
| Linting | ESLint + angular-eslint + typescript-eslint | ^22.6.0 |
| Formatting | Prettier | ^3.9.10 |
| Build tool | Angular CLI / @angular-devkit/build-angular | ^19.2.27 |
| Backend (external) | Node.js + Next.js + MySQL + Sequelize | — |

## Architecture

Strict separation of public pages, protected app shell, and lazy-loaded feature modules.

```
src/
├── app/
│   ├── app.component.ts          ← Root component
│   ├── app.config.ts             ← Angular providers / DI wiring
│   ├── app.routes.ts             ← Route definitions
│   ├── core/
│   │   ├── guards/               ← authGuard (JWT protection)
│   │   ├── interceptors/         ← HTTP interceptors (auth headers)
│   │   └── layout/               ← AppLayoutComponent (authenticated shell)
│   ├── shared/
│   │   └── types/                ← Shared TypeScript interfaces
│   ├── pages/
│   │   ├── home/                 ← Public landing page
│   │   ├── auth/                 ← login, register (public)
│   │   ├── inbox/                ← Protected: messaging
│   │   ├── pipeline/             ← Protected: sales pipeline
│   │   ├── contacts/             ← Protected: CRM contacts
│   │   ├── orders/               ← Protected: order management
│   │   ├── catalog/              ← Protected: products/services
│   │   ├── map/                  ← Protected: floor/table map
│   │   ├── agenda/               ← Protected: agenda/calendar
│   │   ├── agent/                ← Protected: AI assistant
│   │   ├── labs/                 ← Protected: experiments
│   │   ├── business/             ← Protected: business settings
│   │   └── configuration/        ← Protected: app configuration
│   └── store/                    ← Global state management
└── environments/                 ← Environment config (dev/prod)
```

### Request Flow

```
User action
      ↓
Angular Component
      ↓
Service (HTTP call via HttpClient)
      ↓
HTTP Interceptor (attach JWT, handle errors)
      ↓
web-crm-be REST API (Node.js/Next.js)
      ↓
MySQL via Sequelize
```

### Transport

- **Endpoint**: `web-crm-be` REST API
- **Protocol**: HTTP/REST with JSON payloads
- **Auth**: JWT — stored in localStorage, injected by interceptor

## Route Map

| Visibility | Path | Component |
|-----------|------|-----------|
| Public | `/home` | `HomeComponent` |
| Public | `/login` | `LoginComponent` |
| Public | `/register` | `RegisterComponent` |
| Protected | `/inbox` | `INBOX_ROUTES` (lazy) |
| Protected | `/pipeline` | `PIPELINE_ROUTES` (lazy) |
| Protected | `/contacts` | `CONTACTS_ROUTES` (lazy) |
| Protected | `/orders` | `ORDERS_ROUTES` (lazy) |
| Protected | `/catalog` | `CATALOG_ROUTES` (lazy) |
| Protected | `/map` | `MAP_ROUTES` (lazy) |
| Protected | `/agenda` | `AGENDA_ROUTES` (lazy) |
| Protected | `/agent` | `AGENT_ROUTES` (lazy) |
| Protected | `/labs` | `LABS_ROUTES` (lazy) |
| Protected | `/business` | `BUSINESS_ROUTES` (lazy) |
| Protected | `/configuration` | `CONFIGURATION_ROUTES` (lazy) |

## Service Interface Pattern

Angular services use class-based DI via `app.config.ts` providers:

```typescript
// src/app/core/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}
  login(credentials: LoginRequest): Observable<AuthToken> { ... }
}
```

All HTTP services return `Observable<T>`. Error handling is done in interceptors or via `catchError` in the service.

## DI Wiring (app.config.ts)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

## Key Conventions

- All protected routes are children of `AppLayoutComponent` and gated by `authGuard`
- Feature modules use lazy loading (`loadChildren` / `loadComponent`) — never eagerly imported
- HTTP calls are made only from services — never directly from components
- Components are standalone (Angular 19 default) — no `NgModule` declarations
- State is managed in `src/app/store/` — components do not hold mutable shared state
- TypeScript strict mode is enabled
- Tests use Jest (`jest.config.js`) — not Karma/Jasmine (though jasmine types are present as legacy)
- Never import internal pages cross-module — use router navigation instead

## Feature Documentation Structure

1. Business spec (`flow/1-to_do/`) — user story, acceptance criteria, work plan
2. WIP implementation (`flow/2-wip/`) — active development, component/service plan
3. Review (`flow/3-to_review/`) — PR-ready, test coverage notes
4. Done (`flow/4-done/`) — archived, deployed

## Feature Lifecycle

```
flow/1-to_do/     ← Business spec generated by /rf_to_do
flow/2-wip/       ← Active implementation via /rf_wip + /rf_implement
flow/3-to_review/ ← Ready for review via /rf_review
flow/4-done/      ← Completed via /rf_done
```

Use `/rf_context` to regenerate context files from requirement docs.
Use `/rf_plan` to generate a prioritized implementation plan.
Use `/rf_summary` to see all features, dependencies, and issues.
