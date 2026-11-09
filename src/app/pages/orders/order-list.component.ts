import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { OrdersService } from './orders.service';
import { Order } from '../../shared/types';

const STATUS_CFG: Record<string, { label: string }> = {
  draft:     { label: 'Draft' },
  confirmed: { label: 'Confirmed' },
  preparing: { label: 'Preparing' },
  ready:     { label: 'Ready' },
  delivered: { label: 'Delivered' },
  cancelled: { label: 'Cancelled' },
  refunded:  { label: 'Refunded' },
};

const CHANNEL_LABELS: Record<string, string> = {
  in_store: 'In Store',
  online:   'Online',
  phone:    'Phone',
  app:      'App',
};

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [DecimalPipe, LowerCasePipe],
  template: `
    <div class="page">

      <!-- ── PAGE HEADER ───────────────────── -->
      <header class="page-head">
        <div class="head-left">
          <h1 class="page-title">Orders</h1>
          @if (!loading() && total() > 0) {
            <span class="count-pill">{{ total() | number }}</span>
          }
        </div>
        <button
          class="btn-primary"
          (click)="newOrder()"
          [disabled]="creating()"
          [attr.aria-busy]="creating()"
          style="touch-action:manipulation"
        >
          @if (creating()) {
            <span class="spinner" aria-hidden="true"></span>
            <span>Creating…</span>
          } @else {
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>New order</span>
          }
        </button>
      </header>

      <!-- ── STATUS FILTER TABS ────────────── -->
      <div class="status-tabs-wrap">
        <div class="status-tabs" role="tablist" aria-label="Filter by order status">
          @for (tab of statusTabs; track tab.value) {
            <button
              role="tab"
              class="status-tab"
              [class.status-tab--active]="statusFilter() === tab.value"
              [attr.aria-selected]="statusFilter() === tab.value"
              (click)="setStatus(tab.value)"
              style="touch-action:manipulation"
            >{{ tab.label }}</button>
          }
        </div>
      </div>

      <!-- ── ERROR BAR ─────────────────────── -->
      @if (error()) {
        <div class="error-bar" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ error() }}</span>
          <button class="error-retry" (click)="retry()" style="touch-action:manipulation">Retry</button>
        </div>
      }

      <!-- ── LOADING SKELETON ───────────────── -->
      @if (loading()) {
        <div class="order-card" aria-busy="true" aria-label="Loading orders">
          <div class="list-header" aria-hidden="true">
            <div class="col-code">Order</div>
            <div class="col-date">Date</div>
            <div class="col-channel">Channel</div>
            <div class="col-status">Status</div>
            <div class="col-total">Total</div>
          </div>
          @for (s of skeletons; track s) {
            <div class="skeleton-row">
              <div class="col-code">
                <div class="skel skel-code"></div>
              </div>
              <div class="col-date"><div class="skel skel-line" style="width:80px"></div></div>
              <div class="col-channel"><div class="skel skel-badge"></div></div>
              <div class="col-status"><div class="skel skel-badge"></div></div>
              <div class="col-total"><div class="skel skel-line" style="width:64px;margin-left:auto"></div></div>
            </div>
          }
        </div>
      }

      <!-- ── EMPTY STATE ────────────────────── -->
      @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="19" stroke="#B8A7FF" stroke-width="1.5" stroke-dasharray="4 3"/>
              <rect x="11" y="13" width="18" height="17" rx="2.5" stroke="#8A76E8" stroke-width="1.5"/>
              <path d="M15 18h10M15 22h7" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          @if (statusFilter()) {
            <p class="empty-title">No {{ statusLabel(statusFilter()) | lowercase }} orders</p>
            <p class="empty-sub">Try a different status filter.</p>
            <button class="btn-ghost" (click)="setStatus('')" style="touch-action:manipulation">Show all orders</button>
          } @else {
            <p class="empty-title">No orders yet</p>
            <p class="empty-sub">Create your first order to get started.</p>
            <button class="btn-primary" (click)="newOrder()" [disabled]="creating()" style="touch-action:manipulation">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>New order</span>
            </button>
          }
        </div>
      }

      <!-- ── ORDER LIST ─────────────────────── -->
      @else {
        <div class="order-card">
          <!-- Column headers -->
          <div class="list-header" role="row">
            <div class="col-code"   role="columnheader">Order</div>
            <div class="col-date"   role="columnheader">Date</div>
            <div class="col-channel" role="columnheader">Channel</div>
            <div class="col-status" role="columnheader">Status</div>
            <div class="col-total"  role="columnheader">Total</div>
          </div>

          <div role="list">
            @for (o of orders(); track o.id) {
              <div class="order-row" role="listitem">
                <!-- Order code -->
                <div class="col-code">
                  <span class="order-code">#{{ o.code }}</span>
                  <!-- Mobile: show status badge below code -->
                  <span class="order-status-mobile status-badge" [class]="'status-badge--' + o.status">
                    {{ statusLabel(o.status) }}
                  </span>
                </div>

                <!-- Date -->
                <div class="col-date">
                  <span class="cell-text">{{ formatDate(o.createdAt) }}</span>
                </div>

                <!-- Channel -->
                <div class="col-channel">
                  <span class="channel-badge channel-badge--{{ o.channel }}">
                    {{ channelLabel(o.channel) }}
                  </span>
                </div>

                <!-- Status -->
                <div class="col-status">
                  <span class="status-badge" [class]="'status-badge--' + o.status">
                    {{ statusLabel(o.status) }}
                  </span>
                </div>

                <!-- Total -->
                <div class="col-total">
                  <span class="order-total">{{ formatCurrency(o.total) }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- ── PAGINATION ──────────────────── -->
        @if (totalPages() > 1) {
          <nav class="pagination" aria-label="Pagination">
            <button
              class="page-btn"
              [disabled]="!hasPrev()"
              (click)="prevPage()"
              aria-label="Previous page"
              style="touch-action:manipulation"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L6 8l4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Prev</span>
            </button>
            <span class="page-info">
              {{ pageStart() }}–{{ pageEnd() }} <span class="page-of">of</span> {{ total() | number }}
            </span>
            <button
              class="page-btn"
              [disabled]="!hasNext()"
              (click)="nextPage()"
              aria-label="Next page"
              style="touch-action:manipulation"
            >
              <span>Next</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l4 5-4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </nav>
        }
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
      --border:     rgba(35,26,51,0.10);
      --radius:     12px;
      --danger:     #ef4444;
    }

    /* ── PAGE ─────────────────────────── */
    .page {
      padding: 28px 28px 40px;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    @media (max-width: 640px) {
      .page { padding: 20px 16px 32px; }
    }

    /* ── HEADER ──────────────────────── */
    .page-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .head-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .page-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
      line-height: 1.2;
    }
    .count-pill {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--stream-ink);
      background: rgba(138,118,232,0.12);
      border-radius: 999px;
      padding: 2px 10px;
      letter-spacing: 0.02em;
    }

    /* ── BUTTONS ─────────────────────── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 40px;
      padding: 0 18px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
      box-shadow: 0 2px 8px rgba(138,118,232,0.3);
      white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #7460d4; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(138,118,232,0.4); }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-primary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: 10px; }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 38px;
      padding: 0 18px;
      background: transparent;
      color: var(--stream-ink);
      border: 1.5px solid rgba(138,118,232,0.35);
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s, border-color 0.18s;
    }
    .btn-ghost:hover { background: rgba(138,118,232,0.07); border-color: var(--stream-ink); }
    .btn-ghost:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: 10px; }

    /* ── SPINNER ─────────────────────── */
    .spinner {
      width: 15px; height: 15px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── STATUS FILTER TABS ──────────── */
    .status-tabs-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .status-tabs-wrap::-webkit-scrollbar { display: none; }

    .status-tabs {
      display: inline-flex;
      gap: 6px;
      background: rgba(35,26,51,0.05);
      border-radius: 12px;
      padding: 4px;
      min-width: max-content;
    }
    .status-tab {
      height: 34px;
      padding: 0 14px;
      border: none;
      background: transparent;
      border-radius: 9px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
      white-space: nowrap;
    }
    .status-tab:hover { color: var(--riverbed); }
    .status-tab--active {
      background: #fff;
      color: var(--riverbed);
      box-shadow: 0 1px 4px rgba(35,26,51,0.10);
    }
    .status-tab:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 9px; }

    /* ── ERROR BAR ───────────────────── */
    .error-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
    }
    .error-retry {
      margin-left: auto;
      background: none;
      border: 1.5px solid #fca5a5;
      color: #b91c1c;
      padding: 3px 12px;
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .error-retry:hover { background: #fee2e2; }
    .error-retry:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 6px; }

    /* ── ORDER CARD SHELL ────────────── */
    .order-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    /* ── LIST GRID ───────────────────── */
    .list-header,
    .order-row,
    .skeleton-row {
      display: grid;
      grid-template-columns: 160px 1fr 130px 150px 120px;
      align-items: center;
      gap: 0 16px;
      padding: 0 20px;
    }
    @media (max-width: 1024px) {
      .list-header,
      .order-row,
      .skeleton-row {
        grid-template-columns: 160px 150px 120px;
      }
      .col-date,
      .col-channel { display: none; }
    }
    @media (max-width: 640px) {
      .list-header,
      .order-row,
      .skeleton-row {
        grid-template-columns: 1fr auto;
      }
      .col-date,
      .col-channel,
      .col-status { display: none; }
    }

    /* Column headers */
    .list-header {
      height: 44px;
      border-bottom: 1px solid var(--border);
      background: rgba(241,238,248,0.4);
    }
    .list-header > div {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .col-total { text-align: right; }

    /* Order rows */
    .order-row {
      min-height: 60px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .order-row:last-child { border-bottom: none; }
    .order-row:hover { background: rgba(138,118,232,0.03); }

    /* ── COLUMNS ─────────────────────── */
    .col-code {
      display: flex;
      flex-direction: column;
      gap: 4px;
      justify-content: center;
      padding: 12px 0;
    }
    .order-code {
      font-family: 'DM Mono', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--riverbed);
      letter-spacing: 0.02em;
    }
    /* Mobile: show status badge under code */
    .order-status-mobile {
      display: none;
    }
    @media (max-width: 640px) {
      .order-status-mobile { display: inline-flex; }
    }

    .col-date,
    .col-channel,
    .col-status {
      display: flex;
      align-items: center;
    }
    .col-total {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .cell-text {
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      white-space: nowrap;
    }

    .order-total {
      font-family: 'DM Mono', monospace;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--riverbed);
      letter-spacing: 0.02em;
    }

    /* ── STATUS BADGES ───────────────── */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.73rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }
    .status-badge--draft     { background: rgba(94,86,110,0.10);  color: #5E566E; }
    .status-badge--confirmed { background: rgba(138,118,232,0.13); color: #6B54D6; }
    .status-badge--preparing { background: rgba(245,158,11,0.14);  color: #B45309; }
    .status-badge--ready     { background: rgba(34,165,101,0.13);  color: #1A8A52; }
    .status-badge--delivered { background: rgba(15,118,110,0.13);  color: #0F766E; }
    .status-badge--cancelled { background: rgba(239,68,68,0.12);   color: #b91c1c; }
    .status-badge--refunded  { background: rgba(100,116,139,0.12); color: #475569; }

    /* ── CHANNEL BADGES ──────────────── */
    .channel-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.73rem;
      font-weight: 600;
      white-space: nowrap;
      background: rgba(35,26,51,0.06);
      color: var(--muted);
    }
    .channel-badge--in_store { background: rgba(138,118,232,0.08); color: #6B54D6; }
    .channel-badge--online   { background: rgba(34,165,101,0.10);  color: #1A8A52; }
    .channel-badge--phone    { background: rgba(245,158,11,0.10);  color: #B45309; }
    .channel-badge--app      { background: rgba(59,130,246,0.10);  color: #1D4ED8; }

    /* ── SKELETON ────────────────────── */
    @keyframes shimmer {
      from { background-position: -400px 0; }
      to   { background-position: 400px 0; }
    }
    .skel {
      border-radius: 6px;
      background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .skel-code  { width: 90px; height: 14px; }
    .skel-line  { height: 13px; }
    .skel-badge { width: 70px; height: 22px; border-radius: 999px; }
    .skeleton-row {
      min-height: 60px;
      border-bottom: 1px solid var(--border);
    }
    .skeleton-row:last-child { border-bottom: none; }

    /* ── EMPTY STATE ─────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 64px 24px;
      text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(184,167,255,0.12);
      border-radius: 20px;
      margin-bottom: 4px;
    }
    .empty-title {
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .empty-sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0;
    }

    /* ── PAGINATION ──────────────────── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .page-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--riverbed);
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--stream-ink); color: var(--stream-ink); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 8px; }
    .page-info {
      font-family: 'DM Mono', monospace;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .page-of { color: rgba(94,86,110,0.6); }

    @media (prefers-reduced-motion: reduce) {
      .skel { animation: none; }
      .spinner { animation: none; opacity: 0.6; }
      .btn-primary,
      .order-row,
      .status-tab,
      .page-btn { transition: none; }
    }
  `],
})
export class OrderListComponent implements OnInit {
  private svc = inject(OrdersService);

  orders   = signal<Order[]>([]);
  loading  = signal(true);
  creating = signal(false);
  error    = signal('');
  statusFilter = signal('');
  page     = signal(1);
  total    = signal(0);

  readonly PAGE_SIZE = 20;
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);
  readonly statusTabs = [
    { label: 'All',       value: '' },
    { label: 'Draft',     value: 'draft' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready',     value: 'ready' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Refunded',  value: 'refunded' },
  ];

  totalPages = computed(() => Math.ceil(this.total() / this.PAGE_SIZE) || 1);
  hasPrev    = computed(() => this.page() > 1);
  hasNext    = computed(() => this.page() < this.totalPages());
  pageStart  = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.PAGE_SIZE + 1);
  pageEnd    = computed(() => Math.min(this.page() * this.PAGE_SIZE, this.total()));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.list({ status: this.statusFilter(), page: this.page() }).subscribe({
      next: (res) => {
        this.orders.set(res.data.data);
        this.total.set(res.data.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load orders. Please try again.');
        this.loading.set(false);
      },
    });
  }

  setStatus(status: string) {
    this.statusFilter.set(status);
    this.page.set(1);
    this.load();
  }

  prevPage() {
    if (this.hasPrev()) { this.page.update(p => p - 1); this.load(); }
  }

  nextPage() {
    if (this.hasNext()) { this.page.update(p => p + 1); this.load(); }
  }

  retry() { this.load(); }

  newOrder() {
    this.creating.set(true);
    this.svc.create({ channel: 'in_store' }).subscribe({
      next: (res) => {
        this.orders.update(o => [res.data as Order, ...o]);
        this.total.update(t => t + 1);
        this.creating.set(false);
      },
      error: () => {
        this.error.set('Failed to create order. Please try again.');
        this.creating.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    return STATUS_CFG[status]?.label ?? status;
  }

  channelLabel(channel: string): string {
    return CHANNEL_LABELS[channel] ?? channel;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  formatCurrency(n: number): string {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
