# Issues & Blockers — web-crm-fe

## Open Issues

_No open issues documented at this time._

---

## Risks

### R1 — JWT stored in localStorage is vulnerable to XSS
- **Probability:** Medium
- **Impact:** High — token theft enables account takeover
- **Affected component:** `core/interceptors/`, `pages/auth/`
- **Mitigation:** Sanitize all dynamic HTML. Avoid `innerHTML` bindings. Use Angular's built-in template binding which escapes output by default. Consider httpOnly cookie-based auth for future hardening.
- **Description:** The current auth design stores the JWT in `localStorage`. If any page is vulnerable to XSS, the token can be exfiltrated. Angular's default template binding escapes HTML, mitigating common XSS vectors, but custom `DomSanitizer.bypassSecurityTrust*` usage must be audited.

### R2 — web-crm-be API contract changes break frontend silently
- **Probability:** Medium (monorepo with separate services)
- **Impact:** Medium — runtime errors in data binding; broken UI
- **Affected component:** All services in `src/app/pages/*/`
- **Mitigation:** Define strict TypeScript interfaces for every API response in `src/app/shared/types/`. Use response mapping in services to detect shape mismatches early. Coordinate API changes between `web-crm-fe` and `web-crm-be` before deployment.
- **Description:** The frontend has no compile-time contract with the backend. Backend model changes (field renames, removals) will only surface at runtime.

### R3 — Lazy-loaded modules increase initial navigation latency on slow connections
- **Probability:** Low (acceptable trade-off)
- **Impact:** Low — first navigation to a feature module triggers a network request
- **Affected component:** All protected routes
- **Mitigation:** Angular's built-in preloading strategies (`PreloadAllModules`) can be configured in `app.config.ts` to preload modules after initial load.
- **Description:** By design, all feature modules are lazy-loaded. This is correct for performance on the critical path but may cause noticeable delays on the first visit to a module on slow connections.

### R4 — authGuard only checks token presence, not expiry
- **Probability:** Medium (likely gap in initial implementation)
- **Impact:** Medium — expired tokens produce 401 responses from the API instead of clean redirects to login
- **Affected component:** `core/guards/auth.guard.ts`, `core/interceptors/`
- **Mitigation:** The HTTP interceptor should handle 401 responses by clearing the token and redirecting to `/login`. The guard should additionally check token expiry by decoding the JWT `exp` claim.
- **Description:** A guard that only checks `localStorage` for a token's presence will pass expired tokens through to the API, resulting in 401 errors instead of proactive redirects.

---

## Known Limitations

| # | Component | Limitation | Acceptable? |
|---|-----------|-----------|-------------|
| 1 | Pipeline drag-and-drop | Requires `@angular/cdk` DragDrop which does not support touch events natively in all browsers | Yes — desktop-primary application |
| 2 | Map module | Floor/table layout rendering complexity is high; no existing map library dependency | Yes — to be addressed during Map module implementation |
| 3 | Agent module | AI assistant back-end integration not yet defined | Yes — Labs/Agent are experimental |
| 4 | Testing | Legacy `jasmine-core` and `karma-*` devDependencies exist alongside Jest — tests should use Jest only | Yes — legacy deps can be removed in a cleanup pass |

---

## Knowledge Base Gaps

| Module | Missing Information | Source File Expected | Priority |
|--------|--------------------|--------------------|---------|
| Auth | JWT expiry handling and refresh token flow | `ai_reactive_framework/2-core_layer/` | P0 |
| Pipeline | Drag-and-drop implementation pattern for CRM deal cards | `ai_reactive_framework/4-assisted_code_layer/` | P0 |
| Testing | Jest + Angular testing patterns for services and components | `ai_reactive_framework/4-assisted_code_layer/testing/testing_template.md` | P1 |
| Agent | AI assistant API contract and streaming response handling | `ai_reactive_framework/1-business_layer/` | P2 |

---

## Build & Infrastructure Issues

| # | Issue | Component | Status |
|---|-------|-----------|--------|
| 1 | Karma/Jasmine devDependencies (`karma`, `karma-chrome-launcher`, `jasmine-core`, `@types/jasmine`) remain in `package.json` but Jest is the active test runner — these are dead weight | `package.json` | Open |
| 2 | No `.env` or environment-variable strategy documented for `web-crm-be` API base URL per environment | `src/environments/` | Open |
| 3 | No CI/CD pipeline documented — build, lint, and test steps not automated | Project root | Open |

---

## Resolved Issues

_No resolved issues documented at this time._
