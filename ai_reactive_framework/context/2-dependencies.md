# Dependencies — web-crm-fe

## External Dependencies

### npm Registry (npmjs.com)

#### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/cdk` | ^19.2.19 | Component Dev Kit (drag-and-drop, overlays, etc.) |
| `@angular/common` | ^19.2.0 | Angular common utilities, `HttpClient`, pipes |
| `@angular/compiler` | ^19.2.0 | Angular template compiler |
| `@angular/core` | ^19.2.0 | Core Angular framework |
| `@angular/forms` | ^19.2.0 | Reactive and template-driven forms |
| `@angular/material` | ^19.2.19 | Material Design UI component library |
| `@angular/platform-browser` | ^19.2.0 | Browser platform support |
| `@angular/platform-browser-dynamic` | ^19.2.0 | JIT bootstrapper |
| `@angular/router` | ^19.2.0 | SPA routing with lazy loading |
| `rxjs` | ~7.8.0 | Reactive streams (Observables, operators) |
| `tslib` | ^2.3.0 | TypeScript runtime helpers |
| `zone.js` | ~0.15.0 | Angular change detection |

#### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular-devkit/build-angular` | ^19.2.27 | Webpack/esbuild build toolchain |
| `@angular/cli` | ^19.2.27 | `ng` CLI for scaffolding and builds |
| `@angular/compiler-cli` | ^19.2.0 | AOT compilation |
| `@types/jest` | ^30.0.0 | Jest TypeScript types |
| `angular-eslint` | ^22.6.0 | ESLint rules for Angular |
| `eslint` | ^10.13.0 | JavaScript/TypeScript linter |
| `jest` | ^29.7.0 | Unit testing framework |
| `jest-environment-jsdom` | ^29.7.0 | Browser-like environment for Jest |
| `jest-preset-angular` | ^14.6.2 | Angular-specific Jest preset |
| `prettier` | ^3.9.10 | Code formatter |
| `ts-node` | ^10.9.2 | TypeScript execution for scripts |
| `typescript` | ~5.7.2 | TypeScript compiler |
| `typescript-eslint` | ^8.71.2 | TypeScript-aware ESLint rules |

---

## External API Dependencies

| API | Description | Auth |
|-----|-------------|------|
| `web-crm-be` REST API | Backend for all CRM data operations | JWT Bearer token |

### Key API Endpoints (web-crm-be)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user, receive JWT |
| `/api/auth/register` | POST | Register new user |
| `/api/pipelines` | GET/POST | Pipeline stage management |
| `/api/pipeline/orders` | GET/POST | Deal cards on pipeline |
| `/api/pipeline/orders/{id}/move` | POST | Move deal card to a different stage |
| `/api/contacts` | GET/POST/PUT/DELETE | CRM contact management |
| `/api/orders` | GET/POST | Order management |
| `/api/catalog` | GET/POST/PUT/DELETE | Products and services catalog |

---

## Internal Dependencies

### Component → Service Mapping

| Component/Module | Service | Description |
|-----------------|---------|-------------|
| `auth/` | `AuthService` | JWT login, register, token storage |
| `pipeline/` | `PipelineService` | Stage and deal card CRUD, move operations |
| `contacts/` | `ContactsService` | Contact CRUD |
| `orders/` | `OrdersService` | Order lifecycle management |
| `catalog/` | `CatalogService` | Products/services CRUD |
| `inbox/` | `InboxService` | Message thread management |
| `map/` | `MapService` | Floor/table layout management |
| `agenda/` | `AgendaService` | Calendar event management |
| `agent/` | `AgentService` | AI assistant communication |
| `business/` | `BusinessService` | Business profile settings |
| `configuration/` | `ConfigurationService` | App configuration |

### Core Infrastructure

| File | Purpose |
|------|---------|
| `core/guards/auth.guard.ts` | Protects all routes under `AppLayoutComponent` |
| `core/interceptors/` | Attaches JWT to HTTP requests; handles 401 redirect |
| `core/layout/app-layout.component.ts` | App shell: sidebar navigation, header |

### Store → Module Mapping

| Store slice | Feature module | Description |
|-------------|---------------|-------------|
| `store/` | All modules | Shared global state (auth token, user profile, etc.) |

---

## Shared Infrastructure Dependencies

### DI Wiring

To register a new service in the application:

1. Create service file: `src/app/pages/<module>/<module>.service.ts`
2. Decorate with `@Injectable({ providedIn: 'root' })` for global scope
3. Inject `HttpClient` via constructor or `inject(HttpClient)`
4. No manual registration needed in `app.config.ts` when using `providedIn: 'root'`

For scoped services (feature-level only):
```typescript
// In the route definition
{
  path: 'my-module',
  providers: [MyModuleService],
  loadComponent: () => ...
}
```

### HTTP Interceptor Registration

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

### Shared Utilities

| Utility | Path | Used By |
|---------|------|---------|
| Auth guard | `src/app/core/guards/auth.guard.ts` | App router — top-level protected routes |
| HTTP interceptor | `src/app/core/interceptors/` | All HTTP calls via `HttpClient` |
| Shared types | `src/app/shared/types/` | Cross-module interfaces and DTOs |
| App layout | `src/app/core/layout/` | All protected pages |

---

## Knowledge Base Directory

| Domain | Directory | Files |
|--------|-----------|-------|
| Architecture | `ai_reactive_framework/2-core_layer/architecture_specification/` | `patterns_design_catalog.md`, `architecture_patterns_catalog.md`, `trade_off_catalog.md`, `quality_attributes_catalog.md` |
| Business templates | `ai_reactive_framework/1-business_layer/templates/` | `business_rules_template.md`, `plan_template.md`, `dependencies_template.md`, `issues_template.md` |
| Code evaluation | `ai_reactive_framework/4-assisted_code_layer/evaluator/` | `backend_app.md` |
| Testing | `ai_reactive_framework/4-assisted_code_layer/testing/` | `testing_template.md` |

---

## Constraints

- Angular version must be consistent across all `@angular/*` packages — do not upgrade one without upgrading all
- Tests run with Jest — do not add Karma test configurations for new test files
- All HTTP calls must go through a service — never call `HttpClient` from a component
- Lazy loading is required for all protected feature modules — never eagerly import page components in `app.routes.ts`
- JWT is stored in `localStorage` — never log or expose it in component templates or console output
- `TypeScript strict mode` is enabled — no implicit `any`, no unchecked type assertions without justification
