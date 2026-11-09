import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { LabsService, FeatureFlag } from './labs.service';

@Component({
  selector: 'app-labs-panel',
  standalone: true,
  imports: [],
  template: `
    <div class="page">

      <!-- ── HERO BANNER ────────────────────────────── -->
      <div class="hero">
        <div class="hero-badge">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 1h4M7 1v3.5L10.5 9a4 4 0 1 1-7 0L7 4.5V1" stroke="#B8A7FF" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="5.5" cy="9.5" r="0.75" fill="#B8A7FF"/>
            <circle cx="8" cy="10.5" r="0.75" fill="#B8A7FF"/>
          </svg>
          EXPERIMENTAL
        </div>
        <h1 class="hero-title">Labs</h1>
        <p class="hero-sub">Enable or disable experimental features. Changes take effect immediately — some may affect performance or stability.</p>
        @if (!loading() && !error()) {
          <div class="hero-stats" aria-live="polite" aria-atomic="true">
            <span class="stat-pill stat-pill--active">
              <span class="stat-dot stat-dot--green" aria-hidden="true"></span>
              {{ enabledCount() }} active
            </span>
            <span class="stat-pill">
              <span class="stat-dot stat-dot--gray" aria-hidden="true"></span>
              {{ disabledCount() }} inactive
            </span>
          </div>
        }
      </div>

      <!-- ── ERROR TOAST ─────────────────────────────── -->
      @if (lastError()) {
        <div class="error-bar" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ lastError() }}
        </div>
      }

      <!-- ── LOADING SKELETON ────────────────────────── -->
      @if (loading()) {
        <div class="flags-card" aria-busy="true" aria-label="Loading feature flags">
          @for (_ of skeletons; track $index) {
            <div class="skel-row">
              <div class="skel-left">
                <div class="skel skel--dot"></div>
                <div class="skel-lines">
                  <div class="skel skel--title"></div>
                  <div class="skel skel--desc"></div>
                  <div class="skel skel--code"></div>
                </div>
              </div>
              <div class="skel skel--toggle"></div>
            </div>
          }
        </div>
      }

      <!-- ── LOAD ERROR ──────────────────────────────── -->
      @if (!loading() && error()) {
        <div class="load-error" role="alert">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="14.5" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M16 9v8M16 21v2" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <p class="load-error-msg">{{ error() }}</p>
          <button class="btn-retry" (click)="loadFlags()" style="touch-action:manipulation">Try again</button>
        </div>
      }

      <!-- ── FLAGS LIST ──────────────────────────────── -->
      @if (!loading() && !error()) {
        <div class="flags-card" role="list" aria-label="Feature flags">
          @for (flag of flags(); track flag.id; let last = $last) {
            <div class="flag-row" role="listitem">

              <!-- Status dot -->
              <span class="flag-dot"
                [class.flag-dot--on]="flag.isEnabled"
                [attr.aria-label]="flag.isEnabled ? 'Enabled' : 'Disabled'"
                aria-hidden="true">
              </span>

              <!-- Info -->
              <div class="flag-info">
                <div class="flag-name-row">
                  <span class="flag-label">{{ flag.label ?? flag.key }}</span>
                  <code class="flag-key">{{ flag.key }}</code>
                </div>
                @if (flag.description) {
                  <p class="flag-desc">{{ flag.description }}</p>
                }
              </div>

              <!-- Toggle -->
              <div class="flag-toggle-wrap">
                @if (isSaving(flag.id)) {
                  <span class="saving-ring" aria-hidden="true"></span>
                }
                <button
                  type="button"
                  role="switch"
                  [attr.aria-checked]="flag.isEnabled"
                  [attr.aria-label]="(flag.isEnabled ? 'Disable ' : 'Enable ') + (flag.label ?? flag.key)"
                  [class.toggle--on]="flag.isEnabled"
                  [class.toggle--saving]="isSaving(flag.id)"
                  [disabled]="isSaving(flag.id)"
                  class="toggle-btn"
                  (click)="toggle(flag)"
                  style="touch-action:manipulation">
                  <span class="toggle-thumb" aria-hidden="true"></span>
                </button>
              </div>

            </div>
            @if (!last) { <div class="flag-divider" role="separator"></div> }
          } @empty {
            <div class="empty-state" role="status">
              <div class="empty-icon">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <path d="M13 4h10M18 4v8L23.5 20a8 8 0 1 1-11 0L18 12V4" stroke="#B8A7FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="14" cy="22" r="1.5" fill="#B8A7FF"/>
                  <circle cx="20" cy="24.5" r="1.5" fill="#B8A7FF"/>
                </svg>
              </div>
              <p class="empty-title">No feature flags</p>
              <p class="empty-sub">No experimental features are configured yet. Check back later.</p>
            </div>
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
      --border:     rgba(35,26,51,0.12);
      --radius:     12px;
      --shadow-sm:  0 1px 3px rgba(35,26,51,0.07), 0 1px 2px rgba(35,26,51,0.04);
    }

    /* ── PAGE ──────────────────────────────── */
    .page {
      padding: 24px;
      background: var(--shallows);
      min-height: 100%;
      box-sizing: border-box;
      max-width: 760px;
    }
    @media (max-width: 768px) { .page { padding: 16px; } }

    /* ── HERO ──────────────────────────────── */
    .hero {
      background: linear-gradient(135deg, var(--riverbed) 0%, #3b2860 100%);
      border-radius: 16px;
      padding: 28px 28px 24px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(184,167,255,0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(184,167,255,0.15);
      border: 1px solid rgba(184,167,255,0.3);
      border-radius: 100px;
      font-family: 'DM Mono', monospace;
      font-size: 0.68rem;
      font-weight: 500;
      color: var(--stream);
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }
    .hero-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 10px;
    }
    .hero-sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.65);
      margin: 0 0 20px;
      line-height: 1.6;
      max-width: 480px;
    }
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 100px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255,255,255,0.75);
    }
    .stat-pill--active { color: #fff; }
    .stat-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .stat-dot--green { background: var(--ready); }
    .stat-dot--gray  { background: rgba(255,255,255,0.3); }

    /* ── ERROR BAR ─────────────────────────── */
    .error-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      margin-bottom: 12px;
      animation: slideDown 0.2s ease both;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

    /* ── LOAD ERROR ────────────────────────── */
    .load-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      text-align: center;
    }
    .load-error-msg {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      color: var(--muted);
      margin: 12px 0 16px;
    }
    .btn-retry {
      height: 38px;
      padding: 0 20px;
      background: none;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--stream-ink);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-retry:hover { background: #f0ebff; border-color: var(--stream-ink); }
    .btn-retry:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 10px; }

    /* ── FLAGS CARD ────────────────────────── */
    .flags-card {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    /* ── FLAG ROW ──────────────────────────── */
    .flag-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      transition: background 0.1s;
    }
    .flag-row:hover { background: #fafafa; }
    .flag-divider { height: 1px; background: rgba(35,26,51,0.07); margin: 0 20px; }

    .flag-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #d1d5db;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    .flag-dot--on { background: var(--ready); box-shadow: 0 0 0 3px rgba(34,165,101,0.18); }

    .flag-info { flex: 1; min-width: 0; }
    .flag-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .flag-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.925rem;
      font-weight: 700;
      color: var(--riverbed);
    }
    .flag-key {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--stream-ink);
      background: #f0ebff;
      padding: 2px 7px;
      border-radius: 5px;
      white-space: nowrap;
    }
    .flag-desc {
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      margin: 0;
      line-height: 1.5;
    }

    /* ── TOGGLE ────────────────────────────── */
    .flag-toggle-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .saving-ring {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(138,118,232,0.25);
      border-top-color: var(--stream-ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .toggle-btn {
      width: 48px;
      height: 26px;
      padding: 0;
      background: #d1d5db;
      border: none;
      border-radius: 13px;
      cursor: pointer;
      position: relative;
      transition: background 0.22s;
      flex-shrink: 0;
    }
    .toggle-btn.toggle--on { background: var(--stream-ink); }
    .toggle-btn.toggle--saving { opacity: 0.6; cursor: not-allowed; }
    .toggle-btn:disabled { cursor: not-allowed; }
    .toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      display: block;
    }
    .toggle-btn.toggle--on .toggle-thumb { transform: translateX(22px); }
    .toggle-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 13px; }

    /* ── SKELETON ──────────────────────────── */
    .skel-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 18px 20px;
      border-bottom: 1px solid rgba(35,26,51,0.06);
    }
    .skel-row:last-child { border-bottom: none; }
    .skel-left { display: flex; align-items: flex-start; gap: 14px; flex: 1; }
    .skel-lines { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .skel {
      background: linear-gradient(90deg, #f0ebff 0%, #e4ddf8 50%, #f0ebff 100%);
      background-size: 200% 100%;
      border-radius: 5px;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .skel--dot    { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .skel--title  { height: 16px; width: 55%; }
    .skel--desc   { height: 13px; width: 80%; }
    .skel--code   { height: 13px; width: 32%; border-radius: 5px; }
    .skel--toggle { width: 48px; height: 26px; border-radius: 13px; flex-shrink: 0; }

    /* ── EMPTY STATE ───────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 56px 24px;
      text-align: center;
    }
    .empty-icon {
      width: 72px;
      height: 72px;
      background: #f0ebff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 8px;
    }
    .empty-sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0;
      max-width: 320px;
      line-height: 1.5;
    }

    /* ── REDUCED MOTION ────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .saving-ring    { animation: none; opacity: 0.5; }
      .skel           { animation: none; background: #ede9fe; }
      .toggle-thumb, .toggle-btn { transition: none; }
      .flag-dot       { transition: none; }
      .error-bar      { animation: none; }
    }
  `],
})
export class LabsPanelComponent implements OnInit {
  private svc = inject(LabsService);

  readonly skeletons = Array(5);

  flags     = signal<FeatureFlag[]>([]);
  loading   = signal(true);
  error     = signal('');
  lastError = signal('');
  savingIds = signal<Set<string>>(new Set());

  enabledCount  = computed(() => this.flags().filter(f => f.isEnabled).length);
  disabledCount = computed(() => this.flags().filter(f => !f.isEnabled).length);

  ngOnInit() { this.loadFlags(); }

  loadFlags() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getFlags().subscribe({
      next: (res) => { this.flags.set(res.data as FeatureFlag[]); this.loading.set(false); },
      error: () => { this.error.set('Failed to load feature flags. Please try again.'); this.loading.set(false); },
    });
  }

  toggle(flag: FeatureFlag) {
    const newVal = !flag.isEnabled;

    // Optimistic update
    this.flags.update(list => list.map(f => f.id === flag.id ? { ...f, isEnabled: newVal } : f));
    this.savingIds.update(ids => new Set([...ids, flag.id]));

    this.svc.toggle(flag.key, newVal).subscribe({
      next: () => {
        this.savingIds.update(ids => { const s = new Set(ids); s.delete(flag.id); return s; });
      },
      error: () => {
        // Revert
        this.flags.update(list => list.map(f => f.id === flag.id ? { ...f, isEnabled: !newVal } : f));
        this.savingIds.update(ids => { const s = new Set(ids); s.delete(flag.id); return s; });
        this.lastError.set('Could not update "' + (flag.label ?? flag.key) + '". Please try again.');
        setTimeout(() => this.lastError.set(''), 3500);
      },
    });
  }

  isSaving(flagId: string): boolean {
    return this.savingIds().has(flagId);
  }
}
