import { Component, inject, signal, OnInit } from '@angular/core';
import { BusinessService, BusinessDto, LocationDto } from './business.service';

const PLAN_CFG: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: '#5E566E', bg: '#F1EEF8' },
  starter:    { label: 'Starter',    color: '#8A76E8', bg: '#EDE9FF' },
  pro:        { label: 'Pro',        color: '#FF6B2C', bg: '#FFF0E9' },
  enterprise: { label: 'Enterprise', color: '#22A565', bg: '#E6F7EF' },
};

@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [],
  template: `
    <div class="page">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-title-wrap">
          <div class="page-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/>
              <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Business</h1>
            <p class="page-sub">Manage your workspace settings and locations</p>
          </div>
        </div>
      </div>

      <!-- Tab strip -->
      <div class="tab-strip" role="tablist" aria-label="Business sections">
        <button
          role="tab"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'settings'"
          [attr.aria-selected]="activeTab() === 'settings'"
          (click)="setTab('settings')"
          style="touch-action:manipulation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          Settings
        </button>
        <button
          role="tab"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'locations'"
          [attr.aria-selected]="activeTab() === 'locations'"
          (click)="setTab('locations')"
          style="touch-action:manipulation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Locations
          @if (locations().length > 0) {
            <span class="tab-badge" [attr.aria-label]="locations().length + ' locations'">{{ locations().length }}</span>
          }
        </button>
      </div>

      <!-- ── SETTINGS TAB ───────────────────────────────── -->
      @if (activeTab() === 'settings') {
        <div role="tabpanel" aria-label="Settings">

          <!-- skeleton -->
          @if (loadingSettings()) {
            <div class="card">
              @for (_ of skeletonRows; track $index) {
                <div class="skel-field">
                  <div class="skel skel--label"></div>
                  <div class="skel skel--input"></div>
                </div>
              }
            </div>
          }

          <!-- form -->
          @if (!loadingSettings()) {
            <div class="card">

              <!-- save success toast -->
              @if (saveSuccess()) {
                <div class="toast toast--success" role="status" aria-live="polite">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Settings saved successfully
                </div>
              }
              <!-- save error toast -->
              @if (saveError()) {
                <div class="toast toast--error" role="alert" aria-live="assertive">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {{ saveError() }}
                </div>
              }

              <form (ngSubmit)="saveSettings()" novalidate>

                <div class="section-label">Identity</div>

                <!-- Business name -->
                <div class="field">
                  <label class="label" for="biz-name">Business Name <span class="req" aria-hidden="true">*</span></label>
                  <input
                    id="biz-name"
                    class="input"
                    [class.input--error]="nameError()"
                    type="text"
                    [value]="fName()"
                    (input)="fName.set(getInputValue($event))"
                    autocomplete="organization"
                    placeholder="Acme Corp"
                    aria-required="true"
                    [attr.aria-describedby]="nameError() ? 'name-err' : null"
                  />
                  @if (nameError()) {
                    <span class="field-error" id="name-err" role="alert">Business name is required</span>
                  }
                </div>

                <!-- Logo URL -->
                <div class="field">
                  <label class="label" for="biz-logo">Logo URL</label>
                  <input
                    id="biz-logo"
                    class="input"
                    type="url"
                    [value]="fLogoUrl()"
                    (input)="fLogoUrl.set(getInputValue($event))"
                    autocomplete="url"
                    placeholder="https://cdn.example.com/logo.png"
                  />
                </div>

                <div class="section-label" style="margin-top:24px">Regional</div>

                <div class="field-row">
                  <!-- Timezone -->
                  <div class="field field--grow">
                    <label class="label" for="biz-tz">Timezone</label>
                    <input
                      id="biz-tz"
                      class="input"
                      type="text"
                      [value]="fTimezone()"
                      (input)="fTimezone.set(getInputValue($event))"
                      placeholder="UTC"
                    />
                  </div>
                  <!-- Currency -->
                  <div class="field field--sm">
                    <label class="label" for="biz-cur">Currency</label>
                    <input
                      id="biz-cur"
                      class="input"
                      type="text"
                      [value]="fCurrency()"
                      (input)="fCurrency.set(getInputValue($event))"
                      placeholder="USD"
                      maxlength="3"
                    />
                  </div>
                </div>

                <div class="section-label" style="margin-top:24px">Plan</div>

                <!-- Plan select -->
                <div class="field">
                  <label class="label" for="biz-plan">Subscription Plan</label>
                  <div class="select-wrap">
                    <select id="biz-plan" class="input input--select" (change)="setPlan($event)">
                      <option value="free"       [selected]="fPlan() === 'free'">Free</option>
                      <option value="starter"    [selected]="fPlan() === 'starter'">Starter</option>
                      <option value="pro"        [selected]="fPlan() === 'pro'">Pro</option>
                      <option value="enterprise" [selected]="fPlan() === 'enterprise'">Enterprise</option>
                    </select>
                    <svg class="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  @if (planCfg(); as p) {
                    <span class="plan-badge" [style.color]="p.color" [style.background]="p.bg">
                      {{ p.label }}
                    </span>
                  }
                </div>

                <!-- Submit -->
                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn-primary"
                    [disabled]="savingSettings()"
                    [attr.aria-busy]="savingSettings()"
                    style="touch-action:manipulation"
                  >
                    @if (savingSettings()) {
                      <span class="spinner" aria-hidden="true"></span>
                      <span>Saving…</span>
                    } @else {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      <span>Save Settings</span>
                    }
                  </button>
                </div>

              </form>
            </div>
          }
        </div>
      }

      <!-- ── LOCATIONS TAB ──────────────────────────────── -->
      @if (activeTab() === 'locations') {
        <div role="tabpanel" aria-label="Locations">

          <!-- locations load error -->
          @if (locationsError()) {
            <div class="state-box state-box--error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{{ locationsError() }}</p>
              <button class="btn-retry" (click)="loadLocations()" style="touch-action:manipulation">Try again</button>
            </div>
          }

          <!-- skeleton -->
          @if (loadingLocations()) {
            <div class="loc-list">
              @for (_ of skeletonRows; track $index) {
                <div class="loc-skel">
                  <div class="skel skel--loc-title"></div>
                  <div class="skel skel--loc-sub"></div>
                </div>
              }
            </div>
          }

          @if (!loadingLocations() && !locationsError()) {

            <!-- Add location button -->
            @if (!showAddForm()) {
              <div class="loc-toolbar">
                <button class="btn-primary" (click)="openAddForm()" style="touch-action:manipulation">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Location
                </button>
              </div>
            }

            <!-- Add location form -->
            @if (showAddForm()) {
              <div class="card card--add">
                <div class="card-header">
                  <h2 class="card-title">New Location</h2>
                  <button class="btn-icon" (click)="cancelAddForm()" aria-label="Cancel" style="touch-action:manipulation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                @if (addError()) {
                  <div class="toast toast--error" role="alert" aria-live="assertive">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ addError() }}
                  </div>
                }

                <form (ngSubmit)="submitLocation()" novalidate>
                  <div class="field">
                    <label class="label" for="loc-name">Location Name <span class="req" aria-hidden="true">*</span></label>
                    <input
                      id="loc-name"
                      class="input"
                      [class.input--error]="locNameError()"
                      type="text"
                      [value]="fLocName()"
                      (input)="fLocName.set(getInputValue($event))"
                      placeholder="Main Branch"
                      aria-required="true"
                      [attr.aria-describedby]="locNameError() ? 'loc-name-err' : null"
                    />
                    @if (locNameError()) {
                      <span class="field-error" id="loc-name-err" role="alert">Location name is required</span>
                    }
                  </div>

                  <div class="field-row">
                    <div class="field field--grow">
                      <label class="label" for="loc-city">City</label>
                      <input
                        id="loc-city"
                        class="input"
                        type="text"
                        [value]="fLocCity()"
                        (input)="fLocCity.set(getInputValue($event))"
                        placeholder="New York"
                      />
                    </div>
                    <div class="field field--grow">
                      <label class="label" for="loc-country">Country</label>
                      <input
                        id="loc-country"
                        class="input"
                        type="text"
                        [value]="fLocCountry()"
                        (input)="fLocCountry.set(getInputValue($event))"
                        placeholder="US"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label class="label" for="loc-addr">Address</label>
                    <input
                      id="loc-addr"
                      class="input"
                      type="text"
                      [value]="fLocAddress()"
                      (input)="fLocAddress.set(getInputValue($event))"
                      placeholder="123 Main St, Suite 400"
                      autocomplete="street-address"
                    />
                  </div>

                  <div class="field">
                    <label class="label" for="loc-phone">Phone</label>
                    <input
                      id="loc-phone"
                      class="input"
                      type="tel"
                      [value]="fLocPhone()"
                      (input)="fLocPhone.set(getInputValue($event))"
                      placeholder="+1 (555) 000-0000"
                      autocomplete="tel"
                    />
                  </div>

                  <div class="form-actions form-actions--row">
                    <button type="button" class="btn-secondary" (click)="cancelAddForm()" style="touch-action:manipulation">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn-primary"
                      [disabled]="addingLocation()"
                      [attr.aria-busy]="addingLocation()"
                      style="touch-action:manipulation"
                    >
                      @if (addingLocation()) {
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Adding…</span>
                      } @else {
                        <span>Add Location</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- empty state -->
            @if (locations().length === 0) {
              <div class="state-box">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p>No locations yet</p>
                <span>Add your first location to get started</span>
              </div>
            }

            <!-- location list -->
            @if (locations().length > 0) {
              <ul class="loc-list" aria-label="Locations">
                @for (loc of locations(); track loc.id) {
                  <li class="loc-card">
                    <div class="loc-card__body">
                      <div class="loc-card__name">
                        {{ loc.name }}
                        @if (loc.isPrimary) {
                          <span class="primary-badge">Primary</span>
                        }
                      </div>
                      @if (loc.address || loc.city || loc.country) {
                        <div class="loc-card__meta">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {{ locMeta(loc) }}
                        </div>
                      }
                      @if (loc.phone) {
                        <div class="loc-card__meta">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {{ loc.phone }}
                        </div>
                      }
                    </div>

                    <!-- confirm delete -->
                    @if (confirmDeleteId() === loc.id) {
                      <div class="confirm-delete">
                        <span class="confirm-delete__text">Delete this location?</span>
                        <button
                          class="btn-confirm-yes"
                          [disabled]="deletingId() === loc.id"
                          (click)="doDelete(loc.id!)"
                          style="touch-action:manipulation"
                        >
                          @if (deletingId() === loc.id) {
                            <span class="spinner spinner--sm" aria-hidden="true"></span>
                          } @else {
                            Delete
                          }
                        </button>
                        <button class="btn-confirm-no" (click)="cancelDelete()" style="touch-action:manipulation">Cancel</button>
                      </div>
                    } @else {
                      <button
                        class="btn-delete"
                        (click)="confirmDelete(loc.id!)"
                        [attr.aria-label]="'Delete ' + loc.name"
                        style="touch-action:manipulation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    }
                  </li>
                }
              </ul>
            }
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --riverbed:   #231A33;
      --shallows:   #F1EEF8;
      --stream:     #B8A7FF;
      --stream-ink: #8A76E8;
      --current:    #FF6B2C;
      --ready:      #22A565;
      --muted:      #5E566E;
      --danger:     #ef4444;
      --border:     rgba(35,26,51,0.12);
      --radius:     12px;
    }

    /* ── PAGE ────────────────────────────── */
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }
    @media (max-width: 640px) { .page { padding: 24px 16px 48px; } }

    /* ── PAGE HEADER ─────────────────────── */
    .page-header { margin-bottom: 28px; }
    .page-title-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .page-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--stream-ink), #6e56d4);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .page-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 2px;
    }
    .page-sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0;
    }

    /* ── TAB STRIP ───────────────────────── */
    .tab-strip {
      display: flex;
      gap: 4px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 28px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      transition: color 0.15s, background 0.15s;
    }
    .tab-btn:hover { color: var(--riverbed); background: rgba(138,118,232,0.05); }
    .tab-btn--active { color: var(--stream-ink); border-bottom-color: var(--stream-ink); }
    .tab-btn:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 2px;
    }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      background: var(--stream-ink);
      color: #fff;
      border-radius: 10px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .tab-btn--active .tab-badge { background: var(--stream-ink); }
    .tab-btn:not(.tab-btn--active) .tab-badge { background: rgba(138,118,232,0.25); color: var(--stream-ink); }

    /* ── CARD ────────────────────────────── */
    .card {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      padding: 28px 28px 24px;
      box-shadow: 0 2px 8px rgba(35,26,51,0.05);
    }
    @media (max-width: 640px) { .card { padding: 20px 16px; } }
    .card--add { margin-bottom: 20px; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-title {
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }

    /* ── SECTION LABEL ───────────────────── */
    .section-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
    }

    /* ── FIELD ───────────────────────────── */
    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }
    .field--grow { flex: 1 1 0; }
    .field--sm { flex: 0 0 100px; }
    .field-row {
      display: flex;
      gap: 12px;
    }
    @media (max-width: 480px) { .field-row { flex-direction: column; } .field--sm { flex: 1 1 auto; } }
    .label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--riverbed);
      margin-bottom: 6px;
    }
    .req { color: var(--current); margin-left: 2px; }
    .field-error {
      margin-top: 4px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      color: var(--danger);
    }

    /* ── INPUT ───────────────────────────── */
    .input {
      height: 44px;
      padding: 0 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      color: var(--riverbed);
      background: #fff;
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
      width: 100%;
      box-sizing: border-box;
    }
    .input::placeholder { color: rgba(94,86,110,0.45); }
    .input:hover { border-color: rgba(138,118,232,0.4); }
    .input:focus {
      border-color: var(--stream-ink);
      box-shadow: 0 0 0 3px rgba(138,118,232,0.15);
    }
    .input--error {
      border-color: var(--danger) !important;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.10) !important;
    }
    .input--select { appearance: none; cursor: pointer; padding-right: 36px; }

    /* select wrapper */
    .select-wrap { position: relative; }
    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--muted);
    }

    /* plan badge */
    .plan-badge {
      display: inline-flex;
      margin-top: 8px;
      padding: 3px 10px;
      border-radius: 20px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      align-self: flex-start;
    }

    /* ── FORM ACTIONS ────────────────────── */
    .form-actions {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
    .form-actions--row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* ── BUTTONS ─────────────────────────── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 0 22px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
      box-shadow: 0 2px 8px rgba(138,118,232,0.28);
    }
    .btn-primary:hover:not(:disabled) {
      background: #7460d4;
      box-shadow: 0 4px 14px rgba(138,118,232,0.38);
      transform: translateY(-1px);
    }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }
    .btn-primary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: var(--radius); }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 0 20px;
      background: var(--shallows);
      color: var(--riverbed);
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: #e5e0f3; }
    .btn-secondary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    .btn-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--shallows);
      border: none;
      border-radius: 8px;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .btn-icon:hover { background: #e5e0f3; color: var(--riverbed); }
    .btn-icon:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    .btn-delete {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1.5px solid transparent;
      border-radius: 8px;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .btn-delete:hover {
      background: #fef2f2;
      color: var(--danger);
      border-color: rgba(239,68,68,0.25);
    }
    .btn-delete:focus-visible { outline: 2px solid var(--danger); outline-offset: 2px; }

    .btn-retry {
      margin-top: 12px;
      padding: 8px 20px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-retry:hover { background: #7460d4; }
    .btn-retry:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    /* confirm delete inline */
    .confirm-delete {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .confirm-delete__text {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--danger);
      white-space: nowrap;
    }
    @media (max-width: 480px) { .confirm-delete { flex-direction: column; align-items: flex-end; } }
    .btn-confirm-yes {
      height: 32px;
      padding: 0 12px;
      background: var(--danger);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .btn-confirm-yes:hover:not(:disabled) { background: #dc2626; }
    .btn-confirm-yes:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-confirm-yes:focus-visible { outline: 2px solid var(--danger); outline-offset: 2px; }
    .btn-confirm-no {
      height: 32px;
      padding: 0 12px;
      background: var(--shallows);
      color: var(--riverbed);
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .btn-confirm-no:hover { background: #e5e0f3; }
    .btn-confirm-no:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    /* ── TOASTS ──────────────────────────── */
    .toast {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .toast--success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }
    .toast--error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    /* ── LOCATIONS ───────────────────────── */
    .loc-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .loc-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .loc-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .loc-card:hover {
      border-color: rgba(138,118,232,0.3);
      box-shadow: 0 2px 10px rgba(35,26,51,0.07);
    }
    .loc-card__body { flex: 1 1 0; min-width: 0; }
    .loc-card__name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--riverbed);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .primary-badge {
      display: inline-flex;
      padding: 2px 8px;
      background: rgba(138,118,232,0.12);
      color: var(--stream-ink);
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .loc-card__meta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      color: var(--muted);
      margin-top: 4px;
    }

    /* ── SKELETONS ───────────────────────── */
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .skel {
      border-radius: 6px;
      background: linear-gradient(90deg, #ede9f8 25%, #f7f4fd 50%, #ede9f8 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .skel--label  { height: 12px; width: 80px; margin-bottom: 8px; }
    .skel--input  { height: 44px; width: 100%; border-radius: 12px; }
    .skel-field { margin-bottom: 18px; }
    .skel--loc-title { height: 16px; width: 140px; margin-bottom: 8px; }
    .skel--loc-sub   { height: 12px; width: 220px; }
    .loc-skel {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
    }

    /* ── STATE BOXES ─────────────────────── */
    .state-box {
      text-align: center;
      padding: 48px 24px;
      color: var(--muted);
    }
    .state-box svg { color: rgba(138,118,232,0.3); margin-bottom: 12px; }
    .state-box p { font-family: 'Manrope', sans-serif; font-size: 0.95rem; font-weight: 600; color: var(--riverbed); margin: 0 0 4px; }
    .state-box span { font-family: 'Manrope', sans-serif; font-size: 0.875rem; color: var(--muted); }
    .state-box--error svg { color: rgba(239,68,68,0.4); }
    .state-box--error p { color: var(--danger); }

    /* ── SPINNER ─────────────────────────── */
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    .spinner--sm { width: 12px; height: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── REDUCED MOTION ──────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .skel { animation: none; background: #ede9f8; }
      .spinner { animation: none; opacity: 0.6; }
      .btn-primary { transition: none; }
      .loc-card { transition: none; }
    }
  `],
})
export class BusinessSettingsComponent implements OnInit {
  private svc = inject(BusinessService);

  readonly skeletonRows = [1, 2, 3, 4];

  // ── tab ──────────────────────────────────────────────────────────
  activeTab = signal<'settings' | 'locations'>('settings');

  // ── settings form ────────────────────────────────────────────────
  fName     = signal('');
  fTimezone = signal('UTC');
  fCurrency = signal('USD');
  fPlan     = signal('free');
  fLogoUrl  = signal('');

  loadingSettings  = signal(true);
  savingSettings   = signal(false);
  saveSuccess      = signal(false);
  saveError        = signal('');
  settingsTouched  = signal(false);

  nameError() { return this.settingsTouched() && !this.fName().trim(); }
  planCfg()   { return PLAN_CFG[this.fPlan()] ?? null; }

  // ── locations ────────────────────────────────────────────────────
  locations       = signal<LocationDto[]>([]);
  loadingLocations = signal(true);
  locationsError  = signal('');

  showAddForm    = signal(false);
  fLocName       = signal('');
  fLocAddress    = signal('');
  fLocCity       = signal('');
  fLocCountry    = signal('');
  fLocPhone      = signal('');
  addingLocation = signal(false);
  addError       = signal('');
  addTouched     = signal(false);

  confirmDeleteId = signal<string | null>(null);
  deletingId      = signal<string | null>(null);

  locNameError() { return this.addTouched() && !this.fLocName().trim(); }

  // ── lifecycle ────────────────────────────────────────────────────
  ngOnInit() {
    this.loadSettings();
    this.loadLocations();
  }

  // ── helpers ──────────────────────────────────────────────────────
  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  setPlan(event: Event) {
    this.fPlan.set((event.target as HTMLSelectElement).value);
  }

  setTab(tab: 'settings' | 'locations') {
    this.activeTab.set(tab);
  }

  // ── settings ─────────────────────────────────────────────────────
  loadSettings() {
    this.loadingSettings.set(true);
    this.svc.get().subscribe({
      next: (res) => {
        const d = res.data as BusinessDto;
        this.fName.set(d.name ?? '');
        this.fTimezone.set(d.timezone ?? 'UTC');
        this.fCurrency.set(d.currency ?? 'USD');
        this.fPlan.set(d.plan ?? 'free');
        this.fLogoUrl.set(d.logoUrl ?? '');
        this.loadingSettings.set(false);
      },
      error: () => { this.loadingSettings.set(false); },
    });
  }

  saveSettings() {
    this.settingsTouched.set(true);
    if (!this.fName().trim()) {
      (document.getElementById('biz-name') as HTMLElement)?.focus();
      return;
    }
    this.savingSettings.set(true);
    this.saveError.set('');
    const dto: Partial<BusinessDto> = {
      name:     this.fName().trim(),
      timezone: this.fTimezone().trim(),
      currency: this.fCurrency().trim(),
      plan:     this.fPlan(),
      logoUrl:  this.fLogoUrl().trim(),
    };
    this.svc.update(dto).subscribe({
      next: () => {
        this.savingSettings.set(false);
        this.saveSuccess.set(true);
        this.settingsTouched.set(false);
        setTimeout(() => this.saveSuccess.set(false), 2500);
      },
      error: (err) => {
        this.savingSettings.set(false);
        this.saveError.set(err.error?.error ?? 'Could not save settings. Please try again.');
        setTimeout(() => this.saveError.set(''), 4000);
      },
    });
  }

  // ── locations ────────────────────────────────────────────────────
  loadLocations() {
    this.loadingLocations.set(true);
    this.locationsError.set('');
    this.svc.getLocations().subscribe({
      next: (res) => {
        this.locations.set(res.data as LocationDto[]);
        this.loadingLocations.set(false);
      },
      error: () => {
        this.locationsError.set('Could not load locations. Please try again.');
        this.loadingLocations.set(false);
      },
    });
  }

  openAddForm() {
    this.fLocName.set('');
    this.fLocAddress.set('');
    this.fLocCity.set('');
    this.fLocCountry.set('');
    this.fLocPhone.set('');
    this.addError.set('');
    this.addTouched.set(false);
    this.showAddForm.set(true);
  }

  cancelAddForm() {
    this.showAddForm.set(false);
    this.addError.set('');
    this.addTouched.set(false);
  }

  submitLocation() {
    this.addTouched.set(true);
    if (!this.fLocName().trim()) {
      (document.getElementById('loc-name') as HTMLElement)?.focus();
      return;
    }
    this.addingLocation.set(true);
    this.addError.set('');
    const dto: Partial<LocationDto> = {
      name:    this.fLocName().trim(),
      address: this.fLocAddress().trim() || undefined,
      city:    this.fLocCity().trim() || undefined,
      country: this.fLocCountry().trim() || undefined,
      phone:   this.fLocPhone().trim() || undefined,
    };
    this.svc.createLocation(dto).subscribe({
      next: (res) => {
        this.locations.update(list => [...list, res.data as LocationDto]);
        this.addingLocation.set(false);
        this.showAddForm.set(false);
        this.addTouched.set(false);
      },
      error: (err) => {
        this.addError.set(err.error?.error ?? 'Could not add location. Please try again.');
        this.addingLocation.set(false);
      },
    });
  }

  confirmDelete(id: string) {
    this.confirmDeleteId.set(id);
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  locMeta(loc: LocationDto): string {
    return [loc.address, loc.city, loc.country].filter(Boolean).join(', ');
  }

  doDelete(id: string) {
    this.deletingId.set(id);
    this.svc.deleteLocation(id).subscribe({
      next: () => {
        this.locations.update(list => list.filter(l => l.id !== id));
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      },
    });
  }
}
