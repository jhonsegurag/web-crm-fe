import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ContactsService } from './contacts.service';
import { Contact } from '../../shared/types';

const AVATAR_PALETTE = [
  '#8A76E8','#FF6B2C','#22A565','#E8A040',
  '#4AADDE','#D96CBA','#76C8A8','#A08CE8',
];

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">

      <!-- ── PAGE HEADER ───────────────────── -->
      <header class="page-head">
        <div class="head-left">
          <h1 class="page-title">Contacts</h1>
          @if (!loading() && total() > 0) {
            <span class="count-pill">{{ total() | number }}</span>
          }
        </div>
        <a class="btn-primary" routerLink="new" style="touch-action:manipulation">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>New contact</span>
        </a>
      </header>

      <!-- ── TOOLBAR ───────────────────────── -->
      <div class="toolbar">
        <!-- Search -->
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.25" stroke="#5E566E" stroke-width="1.5"/>
            <path d="M11 11l2.5 2.5" stroke="#5E566E" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            type="search"
            class="search-input"
            placeholder="Search name, email, company…"
            [value]="search()"
            (input)="onSearchInput($event)"
            aria-label="Search contacts"
          />
          @if (search()) {
            <button class="search-clear" (click)="clearSearch()" aria-label="Clear search" style="touch-action:manipulation">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          }
        </div>

        <!-- Type filter tabs -->
        <div class="type-tabs" role="tablist" aria-label="Filter by contact type">
          @for (tab of typeTabs; track tab.value) {
            <button
              role="tab"
              class="type-tab"
              [class.type-tab--active]="typeFilter() === tab.value"
              [attr.aria-selected]="typeFilter() === tab.value"
              (click)="setTypeFilter(tab.value)"
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
        <div class="contact-card" aria-busy="true" aria-label="Loading contacts">
          <div class="list-header" aria-hidden="true">
            <div class="col-name">Name</div>
            <div class="col-company">Company</div>
            <div class="col-contact">Email / Phone</div>
            <div class="col-type">Type</div>
            <div class="col-tags">Tags</div>
          </div>
          @for (s of skeletons; track s) {
            <div class="skeleton-row">
              <div class="col-name">
                <div class="skel skel-avatar"></div>
                <div class="skel-name-wrap">
                  <div class="skel skel-line" style="width:60%"></div>
                </div>
              </div>
              <div class="col-company"><div class="skel skel-line" style="width:55%"></div></div>
              <div class="col-contact"><div class="skel skel-line" style="width:70%"></div></div>
              <div class="col-type"><div class="skel skel-badge"></div></div>
              <div class="col-tags"><div class="skel skel-tag"></div></div>
            </div>
          }
        </div>
      }

      <!-- ── EMPTY STATE ────────────────────── -->
      @else if (contacts().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="19" stroke="#B8A7FF" stroke-width="1.5" stroke-dasharray="4 3"/>
              <circle cx="20" cy="16" r="5" stroke="#8A76E8" stroke-width="1.5"/>
              <path d="M9 32c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          @if (search() || typeFilter()) {
            <p class="empty-title">No contacts found</p>
            <p class="empty-sub">Try adjusting your search or filter.</p>
            <button class="btn-ghost" (click)="resetFilters()" style="touch-action:manipulation">Clear filters</button>
          } @else {
            <p class="empty-title">No contacts yet</p>
            <p class="empty-sub">Add your first contact to get started.</p>
            <a class="btn-primary" routerLink="new" style="touch-action:manipulation">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>New contact</span>
            </a>
          }
        </div>
      }

      <!-- ── CONTACT LIST ───────────────────── -->
      @else {
        <div class="contact-card">
          <!-- Column headers -->
          <div class="list-header" role="row">
            <div class="col-name" role="columnheader">Name</div>
            <div class="col-company" role="columnheader">Company</div>
            <div class="col-contact" role="columnheader">Email / Phone</div>
            <div class="col-type" role="columnheader">Type</div>
            <div class="col-tags" role="columnheader">Tags</div>
          </div>

          <div role="list">
            @for (c of contacts(); track c.id) {
              <a class="contact-row" [routerLink]="c.id" role="listitem">
                <!-- Name + avatar -->
                <div class="col-name">
                  <div class="avatar" [style.background]="avatarColor(c)" aria-hidden="true">
                    {{ initials(c) }}
                  </div>
                  <span class="contact-name">{{ c.firstName }} {{ c.lastName }}</span>
                </div>

                <!-- Company -->
                <div class="col-company">
                  <span class="cell-text">{{ c.company || '—' }}</span>
                </div>

                <!-- Email / Phone -->
                <div class="col-contact">
                  @if (c.email) {
                    <span class="cell-text">{{ c.email }}</span>
                  }
                  @if (c.phone) {
                    <span class="cell-text cell-text--phone">{{ c.phone }}</span>
                  }
                  @if (!c.email && !c.phone) {
                    <span class="cell-text cell-text--empty">—</span>
                  }
                </div>

                <!-- Type badge -->
                <div class="col-type">
                  <span class="type-badge" [class]="'type-badge--' + c.type">{{ c.type }}</span>
                </div>

                <!-- Tags -->
                <div class="col-tags">
                  @for (tag of visibleTags(c); track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                  @if ((c.tags?.length ?? 0) > 3) {
                    <span class="tag tag--more">+{{ (c.tags?.length ?? 0) - 3 }}</span>
                  }
                </div>
              </a>
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
      max-width: 1200px;
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
      text-decoration: none;
      cursor: pointer;
      transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
      box-shadow: 0 2px 8px rgba(138,118,232,0.3);
      white-space: nowrap;
    }
    .btn-primary:hover { background: #7460d4; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(138,118,232,0.4); }
    .btn-primary:active { transform: translateY(0); }
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

    /* ── TOOLBAR ─────────────────────── */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Search */
    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 360px;
    }
    .search-icon {
      position: absolute;
      left: 13px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      height: 40px;
      padding: 0 40px 0 38px;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--riverbed);
      background: #fff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .search-input::placeholder { color: rgba(94,86,110,0.5); }
    .search-input:hover { border-color: rgba(138,118,232,0.4); }
    .search-input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 3px rgba(138,118,232,0.12); }
    /* Remove native clear button on search type */
    .search-input::-webkit-search-cancel-button { display: none; }

    .search-clear {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted);
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .search-clear:hover { color: var(--riverbed); background: rgba(35,26,51,0.06); }
    .search-clear:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: -2px; border-radius: 6px; }

    /* Type tabs */
    .type-tabs {
      display: flex;
      background: rgba(35,26,51,0.05);
      border-radius: 10px;
      padding: 3px;
      gap: 2px;
      flex-shrink: 0;
    }
    .type-tab {
      height: 34px;
      padding: 0 14px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .type-tab:hover { color: var(--riverbed); }
    .type-tab--active {
      background: #fff;
      color: var(--riverbed);
      box-shadow: 0 1px 4px rgba(35,26,51,0.10);
    }
    .type-tab:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 8px; }

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
    .error-retry:hover { background: #fef2f2; }
    .error-retry:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 6px; }

    /* ── CONTACT CARD SHELL ──────────── */
    .contact-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    /* ── LIST GRID ───────────────────── */
    .list-header,
    .contact-row,
    .skeleton-row {
      display: grid;
      grid-template-columns: 2.5fr 1.5fr 2fr 1fr 1.5fr;
      align-items: center;
      gap: 0 16px;
      padding: 0 20px;
    }
    @media (max-width: 1024px) {
      .list-header,
      .contact-row,
      .skeleton-row {
        grid-template-columns: 2fr 2fr 1fr;
      }
      .col-company,
      .col-tags { display: none; }
    }
    @media (max-width: 640px) {
      .list-header,
      .contact-row,
      .skeleton-row {
        grid-template-columns: 1fr auto;
      }
      .col-company,
      .col-contact,
      .col-tags { display: none; }
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

    /* Contact rows */
    .contact-row {
      min-height: 64px;
      text-decoration: none;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
      cursor: pointer;
    }
    .contact-row:last-child { border-bottom: none; }
    .contact-row:hover { background: rgba(138,118,232,0.04); }
    .contact-row:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: -2px; }

    /* ── AVATAR ──────────────────────── */
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }

    /* ── COLUMNS ─────────────────────── */
    .col-name {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      padding: 14px 0;
    }
    .contact-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--riverbed);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .contact-row:hover .contact-name { color: var(--stream-ink); }

    .col-company,
    .col-contact,
    .col-type,
    .col-tags {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .cell-text {
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .cell-text--phone {
      font-family: 'DM Mono', monospace;
      font-size: 0.8rem;
    }
    .cell-text--empty { color: rgba(94,86,110,0.35); }

    .col-contact {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    /* ── TYPE BADGE ──────────────────── */
    .type-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.73rem;
      font-weight: 700;
      text-transform: capitalize;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }
    .type-badge--customer {
      background: rgba(138,118,232,0.13);
      color: #6B54D6;
    }
    .type-badge--lead {
      background: rgba(255,107,44,0.12);
      color: #D45012;
    }
    .type-badge--supplier {
      background: rgba(34,165,101,0.13);
      color: #1A8A52;
    }

    /* ── TAGS ────────────────────────── */
    .tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--muted);
      background: rgba(35,26,51,0.06);
      white-space: nowrap;
    }
    .tag--more {
      color: var(--stream-ink);
      background: rgba(138,118,232,0.10);
    }

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
    .skel-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
    .skel-line { height: 13px; }
    .skel-badge { width: 64px; height: 22px; border-radius: 999px; }
    .skel-tag { width: 48px; height: 20px; border-radius: 6px; }
    .skel-name-wrap { flex: 1; }
    .skeleton-row {
      min-height: 64px;
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
      width: 72px;
      height: 72px;
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
      transition: border-color 0.15s, background 0.15s, color 0.15s;
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
      .btn-primary,
      .contact-row,
      .type-tab,
      .page-btn { transition: none; }
    }
  `],
})
export class ContactListComponent implements OnInit {
  private svc = inject(ContactsService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  contacts = signal<Contact[]>([]);
  loading  = signal(true);
  error    = signal('');
  search   = signal('');
  typeFilter = signal('');
  page     = signal(1);
  total    = signal(0);

  readonly PAGE_SIZE = 20;
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);
  readonly typeTabs  = [
    { label: 'All',      value: '' },
    { label: 'Customer', value: 'customer' },
    { label: 'Lead',     value: 'lead' },
    { label: 'Supplier', value: 'supplier' },
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
    this.svc.list({
      search:   this.search(),
      type:     this.typeFilter(),
      page:     this.page(),
      pageSize: this.PAGE_SIZE,
    }).subscribe({
      next: (res) => {
        this.contacts.set(res.data.data);
        this.total.set(res.data.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load contacts. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.search.set(val);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 300);
  }

  clearSearch() {
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  setTypeFilter(type: string) {
    this.typeFilter.set(type);
    this.page.set(1);
    this.load();
  }

  resetFilters() {
    this.search.set('');
    this.typeFilter.set('');
    this.page.set(1);
    this.load();
  }

  prevPage() {
    if (this.hasPrev()) {
      this.page.update(p => p - 1);
      this.load();
    }
  }

  nextPage() {
    if (this.hasNext()) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  retry() { this.load(); }

  initials(c: Contact): string {
    return (c.firstName[0] + (c.lastName?.[0] ?? '')).toUpperCase();
  }

  avatarColor(c: Contact): string {
    let hash = 0;
    for (let i = 0; i < c.firstName.length; i++) {
      hash = (hash + c.firstName.charCodeAt(i)) % AVATAR_PALETTE.length;
    }
    return AVATAR_PALETTE[hash];
  }

  visibleTags(c: Contact): string[] {
    return c.tags?.slice(0, 3) ?? [];
  }
}
