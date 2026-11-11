import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../orders/orders.service';
import { CatalogService } from '../catalog/catalog.service';
import { Order, OrderItem, Product } from '../../shared/types';

// TODO: Replace productId free-text input with a CatalogPickerComponent
// once the catalog module is implemented (see 4-plan.md #9 catalog).

@Component({
  selector: 'app-order-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="backdrop" (click)="closed.emit()" aria-hidden="true"></div>
    <div class="modal-card" role="dialog" aria-modal="true"
      [attr.aria-label]="'Order panel for order ' + orderId()"
      (click)="$event.stopPropagation()">

      <!-- ── PANEL HEADER ───────────────────────── -->
      <div class="panel-header">
        <div class="panel-title-row">
          @if (order()) {
            <span class="panel-code">#{{ order()!.code }}</span>
            <span class="panel-channel channel--{{ order()!.channel }}">{{ channelLabel(order()!.channel) }}</span>
          } @else {
            <span class="panel-code">Order</span>
          }
        </div>
        @if (order()) {
          <span class="panel-total">\${{ order()!.total | number:'1.2-2' }}</span>
        }
        <button class="close-btn"
          (click)="closed.emit()"
          aria-label="Close order panel"
          style="touch-action:manipulation">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- ── LOADING ────────────────────────────── -->
      @if (loading()) {
        <div class="panel-loading" aria-busy="true" aria-label="Loading order">
          <div class="skel skel-line" style="width:120px"></div>
          <div class="skel skel-line" style="width:80px;margin-top:6px"></div>
        </div>
      }

      <!-- ── ERROR ──────────────────────────────── -->
      @if (!loading() && loadError()) {
        <div class="panel-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M7 4v3.5M7 9.5v.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ loadError() }}</span>
          <button class="retry-btn" (click)="loadOrder()" style="touch-action:manipulation">Retry</button>
        </div>
      }

      <!-- ── ITEMS ──────────────────────────────── -->
      @if (!loading() && order()) {
        <div class="items-section">
          <p class="section-label">Items</p>

          @if (order()!.items && order()!.items!.length > 0) {
            <ul class="item-list" aria-label="Order items">
              @for (item of order()!.items!; track item.id) {
                <li class="item-row" [attr.aria-label]="item.name + ', qty ' + item.quantity">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    @if (item.notes) {
                      <span class="item-notes">{{ item.notes }}</span>
                    }
                  </div>
                  <div class="item-meta">
                    <span class="item-qty">× {{ item.quantity }}</span>
                    <span class="item-sub">\${{ item.subtotal | number:'1.2-2' }}</span>
                    @if (confirmDeleteId() === item.id) {
                      <button class="del-confirm" (click)="confirmDelete(item.id)"
                        [attr.aria-label]="'Confirm delete ' + item.name"
                        style="touch-action:manipulation">
                        Confirm
                      </button>
                      <button class="del-cancel" (click)="cancelDelete()"
                        aria-label="Cancel delete"
                        style="touch-action:manipulation">
                        Cancel
                      </button>
                    } @else {
                      <button class="del-btn" (click)="requestDelete(item.id)"
                        [attr.aria-label]="'Remove ' + item.name + ' from order'"
                        [disabled]="deletingId() === item.id"
                        style="touch-action:manipulation">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2 3h8M5 3V2h2v1M4.5 9.5V5m3 4.5V5" stroke="currentColor"
                            stroke-width="1.4" stroke-linecap="round"/>
                          <rect x="2.5" y="3" width="7" height="7" rx="1.5"
                            stroke="currentColor" stroke-width="1.4"/>
                        </svg>
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
          } @else {
            <p class="items-empty">No items yet.</p>
          }

          @if (mutateError()) {
            <p class="mutate-error" role="alert">{{ mutateError() }}</p>
          }
        </div>

        <!-- ── ADD ITEM FORM ───────────────────── -->
        <div class="add-section">
          @if (!showAddForm()) {
            <button class="add-item-btn" (click)="openAddForm()"
              aria-label="Add item to order"
              style="touch-action:manipulation">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              Add item
            </button>
          } @else {
            <form class="add-form" (ngSubmit)="submitAddItem()" aria-label="Add item form">
              <p class="form-label">New item</p>
              <!-- Product search -->
              @if (selectedProduct()) {
                <div class="product-chip">
                  <div class="product-chip-info">
                    <span class="product-chip-name">{{ selectedProduct()!.name }}</span>
                    <span class="product-chip-price">\${{ selectedProduct()!.price | number:'1.2-2' }} / {{ selectedProduct()!.unit }}</span>
                  </div>
                  <button class="product-chip-clear" type="button"
                    (click)="clearProductSelection()"
                    aria-label="Clear selected product">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="product-search-wrap">
                  <input
                    class="form-input"
                    type="text"
                    placeholder="Search product…"
                    [value]="searchQuery"
                    (input)="onSearchInput($any($event.target).value)"
                    name="productSearch"
                    aria-label="Search for a product"
                    autocomplete="off"
                  />
                  @if (searchLoading()) {
                    <div class="search-feedback">Searching…</div>
                  } @else if (searchResults().length > 0) {
                    <ul class="search-results" role="listbox" aria-label="Product search results">
                      @for (p of searchResults(); track p.id) {
                        <li class="search-result" role="option" tabindex="0"
                          (click)="selectProduct(p)"
                          (keydown.enter)="selectProduct(p)">
                          <div class="result-info">
                            <span class="result-name">{{ p.name }}</span>
                            @if (p.sku) { <span class="result-sku">{{ p.sku }}</span> }
                          </div>
                          <span class="result-price">\${{ p.price | number:'1.2-2' }}</span>
                        </li>
                      }
                    </ul>
                  } @else if (searchQuery.length >= 2) {
                    <div class="search-feedback search-feedback--empty">No products found</div>
                  }
                </div>
              }
              <div class="form-row">
                <input
                  class="form-input"
                  type="number"
                  placeholder="Qty *"
                  [(ngModel)]="formQuantity"
                  name="quantity"
                  min="1"
                  aria-required="true"
                  aria-label="Quantity"
                  style="max-width:80px"
                />
                <input
                  class="form-input"
                  type="text"
                  placeholder="Notes (optional)"
                  [(ngModel)]="formNotes"
                  name="notes"
                  aria-label="Notes"
                />
              </div>
              @if (addError()) {
                <p class="form-error" role="alert">{{ addError() }}</p>
              }
              <div class="form-actions">
                <button type="submit"
                  class="btn-confirm"
                  [disabled]="!formProductId.trim() || formQuantity < 1 || adding()"
                  style="touch-action:manipulation">
                  {{ adding() ? 'Adding…' : 'Add item' }}
                </button>
                <button type="button"
                  class="btn-cancel"
                  (click)="cancelAddForm()"
                  style="touch-action:manipulation">
                  Cancel
                </button>
              </div>
            </form>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --riverbed:   #231A33;
      --shallows:   #F1EEF8;
      --stream-ink: #8A76E8;
      --ready:      #22A565;
      --muted:      #5E566E;
      --border:     rgba(35,26,51,0.1);
      --radius:     8px;
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── MODAL OVERLAY ───────────────────── */
    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(35,26,51,0.45);
      backdrop-filter: blur(2px);
    }
    .modal-card {
      position: relative;
      z-index: 1;
      width: 480px;
      max-width: calc(100vw - 32px);
      max-height: 85vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(35,26,51,0.25);
      padding: 20px;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: rgba(138,118,232,0.2) transparent;
    }

    /* ── HEADER ──────────────────────────── */
    .panel-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .panel-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }
    .panel-code {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--riverbed);
      white-space: nowrap;
    }
    .panel-channel {
      font-family: 'Manrope', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 999px;
      white-space: nowrap;
      background: rgba(35,26,51,0.07);
      color: var(--muted);
    }
    .channel--in_store { background: rgba(138,118,232,0.1); color: #6B54D6; }
    .channel--online   { background: rgba(34,165,101,0.1);  color: #1A8A52; }
    .channel--phone    { background: rgba(245,158,11,0.1);  color: #B45309; }
    .channel--app      { background: rgba(59,130,246,0.1);  color: #1D4ED8; }

    .panel-total {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--ready);
      white-space: nowrap;
    }
    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: none;
      color: var(--muted);
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .close-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 5px; }

    /* ── LOADING ─────────────────────────── */
    .panel-loading {
      padding: 8px 0;
    }
    @keyframes shimmer {
      0%   { background-position: -300px 0; }
      100% { background-position:  300px 0; }
    }
    .skel {
      border-radius: 4px;
      background: linear-gradient(90deg, rgba(35,26,51,0.06) 25%, rgba(35,26,51,0.12) 50%, rgba(35,26,51,0.06) 75%);
      background-size: 600px 100%;
      animation: shimmer 1.4s infinite linear;
      height: 11px;
    }
    @media (prefers-reduced-motion: reduce) { .skel { animation: none; } }

    /* ── ERRORS ─────────────────────────── */
    .panel-error, .mutate-error, .form-error {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      margin: 6px 0;
    }
    .mutate-error, .form-error {
      display: block;
      padding: 4px 8px;
    }
    .retry-btn {
      margin-left: auto;
      background: none;
      border: 1px solid #fca5a5;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      font-weight: 600;
      color: #b91c1c;
      cursor: pointer;
    }
    .retry-btn:hover { background: #fee2e2; }

    /* ── ITEMS ───────────────────────────── */
    .items-section { margin-bottom: 6px; }
    .section-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 0 0 6px;
    }
    .item-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .item-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
      padding: 6px 8px;
      background: var(--shallows);
      border-radius: 6px;
    }
    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .item-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--riverbed);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-notes {
      font-family: 'Manrope', sans-serif;
      font-size: 0.68rem;
      color: var(--muted);
    }
    .item-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .item-qty {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .item-sub {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--riverbed);
      white-space: nowrap;
    }
    .del-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: none;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .del-btn:hover:not(:disabled) { background: rgba(239,68,68,0.08); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .del-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .del-btn:focus-visible { outline: 2px solid #ef4444; outline-offset: 1px; border-radius: 5px; }
    .del-confirm {
      font-family: 'Manrope', sans-serif;
      font-size: 0.68rem;
      font-weight: 700;
      color: #fff;
      background: #ef4444;
      border: none;
      border-radius: 4px;
      padding: 2px 7px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .del-confirm:hover { background: #dc2626; }
    .del-confirm:focus-visible { outline: 2px solid #ef4444; outline-offset: 1px; }
    .del-cancel {
      font-family: 'Manrope', sans-serif;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--muted);
      background: none;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 7px;
      cursor: pointer;
      white-space: nowrap;
    }
    .del-cancel:hover { background: rgba(35,26,51,0.05); }
    .del-cancel:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; }

    .items-empty {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      color: rgba(94,86,110,0.5);
      margin: 0 0 4px;
    }

    /* ── ADD SECTION ─────────────────────── */
    .add-section { margin-top: 4px; }
    .add-item-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      width: 100%;
      height: 28px;
      background: none;
      border: 1px dashed rgba(138,118,232,0.3);
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(138,118,232,0.7);
      cursor: pointer;
      justify-content: center;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .add-item-btn:hover { background: rgba(138,118,232,0.06); border-color: var(--stream-ink); color: var(--stream-ink); }
    .add-item-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }

    /* ── PRODUCT CHIP ───────────────────── */
    .product-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: rgba(138,118,232,0.08);
      border: 1px solid rgba(138,118,232,0.25);
      border-radius: 7px;
    }
    .product-chip-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
      flex: 1;
    }
    .product-chip-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--riverbed);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .product-chip-price {
      font-family: 'DM Mono', monospace;
      font-size: 0.68rem;
      color: var(--muted);
    }
    .product-chip-clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: 1px solid rgba(138,118,232,0.2);
      border-radius: 4px;
      background: none;
      color: var(--muted);
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .product-chip-clear:hover { background: rgba(239,68,68,0.08); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .product-chip-clear:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; }

    /* ── PRODUCT SEARCH ─────────────────── */
    .product-search-wrap { position: relative; }
    .search-results {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 10;
      list-style: none;
      margin: 0;
      padding: 4px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(35,26,51,0.12);
      max-height: 200px;
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .search-result {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 9px;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .search-result:hover, .search-result:focus-visible {
      background: var(--shallows);
      outline: none;
    }
    .result-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }
    .result-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--riverbed);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .result-sku {
      font-family: 'DM Mono', monospace;
      font-size: 0.65rem;
      color: var(--muted);
    }
    .result-price {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--ready);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .search-feedback {
      padding: 6px 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .search-feedback--empty { color: rgba(94,86,110,0.5); }

    /* ── ADD FORM ────────────────────────── */
    .add-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      background: rgba(241,238,248,0.5);
      border: 1px solid rgba(138,118,232,0.2);
      border-radius: 7px;
    }
    .form-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .form-row {
      display: flex;
      gap: 6px;
    }
    .form-input {
      height: 30px;
      padding: 0 8px;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      color: var(--riverbed);
      background: #fff;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .form-input::placeholder { color: rgba(94,86,110,0.45); }
    .form-input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 2px rgba(138,118,232,0.1); }
    .form-actions {
      display: flex;
      gap: 6px;
    }
    .btn-confirm {
      flex: 1;
      height: 28px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-confirm:hover:not(:disabled) { background: #7460d4; }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-confirm:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }
    .btn-cancel {
      height: 28px;
      padding: 0 10px;
      background: none;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-cancel:hover { background: rgba(35,26,51,0.05); }
    .btn-cancel:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }
  `],
})
export class OrderPanelComponent implements OnInit {
  private svc     = inject(OrdersService);
  private catalog = inject(CatalogService);

  orderId = input.required<string>();
  closed  = output<void>();

  order      = signal<Order | null>(null);
  loading    = signal(true);
  loadError  = signal('');
  mutateError = signal('');

  // Delete confirmation state
  confirmDeleteId = signal<string | null>(null);
  deletingId      = signal<string | null>(null);

  // Add item form state
  showAddForm = signal(false);
  adding      = signal(false);
  addError    = signal('');
  formProductId = '';
  formQuantity  = 1;
  formNotes     = '';

  // Product search state
  searchQuery   = '';
  searchResults = signal<Product[]>([]);
  searchLoading = signal(false);
  selectedProduct = signal<Product | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('document:keydown.escape')
  onEscape() { this.closed.emit(); }

  constructor() {
    // Reload when orderId signal changes
    effect(() => {
      const id = this.orderId();
      if (id) this.loadOrder();
    });
  }

  ngOnInit() { /* effect handles initial load */ }

  loadOrder() {
    this.loading.set(true);
    this.loadError.set('');
    this.svc.get(this.orderId()).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Order not found — it may have been deleted.');
        this.loading.set(false);
      },
    });
  }

  // ── Delete item ─────────────────────────────────
  requestDelete(itemId: string) {
    this.confirmDeleteId.set(itemId);
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(itemId: string) {
    this.confirmDeleteId.set(null);
    this.deletingId.set(itemId);
    this.mutateError.set('');
    this.svc.removeItem(this.orderId(), itemId).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.order.update(o => o
          ? { ...o, items: (o.items ?? []).filter(i => i.id !== itemId) }
          : o
        );
      },
      error: () => {
        this.deletingId.set(null);
        this.mutateError.set('Could not remove item — please retry.');
      },
    });
  }

  // ── Add item form ────────────────────────────────
  openAddForm() {
    this.showAddForm.set(true);
    this.formProductId = '';
    this.formQuantity = 1;
    this.formNotes = '';
    this.addError.set('');
    this.searchQuery = '';
    this.searchResults.set([]);
    this.selectedProduct.set(null);
  }

  cancelAddForm() {
    this.showAddForm.set(false);
    this.addError.set('');
    this.searchQuery = '';
    this.searchResults.set([]);
    this.selectedProduct.set(null);
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  // ── Product search ──────────────────────────────
  onSearchInput(query: string) {
    this.searchQuery = query;
    this.selectedProduct.set(null);
    this.formProductId = '';
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (query.length < 2) { this.searchResults.set([]); return; }
    this.searchTimer = setTimeout(() => this.runSearch(query), 300);
  }

  private runSearch(query: string) {
    this.searchLoading.set(true);
    this.catalog.getProducts({ search: query }).subscribe({
      next: (res) => {
        this.searchResults.set(res.data.data);
        this.searchLoading.set(false);
      },
      error: () => {
        this.searchResults.set([]);
        this.searchLoading.set(false);
      },
    });
  }

  selectProduct(product: Product) {
    this.selectedProduct.set(product);
    this.formProductId = product.id;
    this.searchResults.set([]);
    this.searchQuery = '';
  }

  clearProductSelection() {
    this.selectedProduct.set(null);
    this.formProductId = '';
    this.searchResults.set([]);
    this.searchQuery = '';
  }

  submitAddItem() {
    const productId = this.formProductId.trim();
    if (!productId) { this.addError.set('Product ID is required.'); return; }
    if (this.formQuantity < 1) { this.addError.set('Quantity must be at least 1.'); return; }

    this.adding.set(true);
    this.addError.set('');
    const dto = {
      productId,
      quantity: this.formQuantity,
      ...(this.formNotes.trim() ? { notes: this.formNotes.trim() } : {}),
    };
    this.svc.addItem(this.orderId(), dto).subscribe({
      next: (res) => {
        this.adding.set(false);
        const newItem = res.data as OrderItem;
        this.order.update(o => o
          ? { ...o, items: [...(o.items ?? []), newItem] }
          : o
        );
        this.cancelAddForm();
      },
      error: () => {
        this.adding.set(false);
        this.addError.set('Could not add item — check the product ID and retry.');
      },
    });
  }

  channelLabel(channel: string): string {
    const labels: Record<string, string> = {
      in_store: 'In Store',
      online: 'Online',
      phone: 'Phone',
      app: 'App',
    };
    return labels[channel] ?? channel;
  }
}
