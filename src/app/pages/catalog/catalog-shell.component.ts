import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CatalogService } from './catalog.service';
import { Product, CatalogCategory } from '../../shared/types';

@Component({
  selector: 'app-catalog-shell',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="page">

      <!-- ── PAGE HEADER ───────────────────── -->
      <header class="page-head">
        <div class="head-left">
          <h1 class="page-title">Catalog</h1>
          @if (activeTab() === 'products' && !loadingProducts() && totalProducts() > 0) {
            <span class="count-pill">{{ totalProducts() | number }}</span>
          }
          @if (activeTab() === 'categories' && !loadingCats() && categories().length > 0) {
            <span class="count-pill">{{ categories().length | number }}</span>
          }
        </div>
        @if (activeTab() === 'products') {
          <button class="btn-primary" (click)="toggleAddProduct()" [class.btn-primary--active]="showAddProduct()" style="touch-action:manipulation">
            @if (showAddProduct()) {
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Cancel</span>
            } @else {
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>New product</span>
            }
          </button>
        }
        @if (activeTab() === 'categories') {
          <button class="btn-primary" (click)="toggleAddCategory()" [class.btn-primary--active]="showAddCategory()" style="touch-action:manipulation">
            @if (showAddCategory()) {
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Cancel</span>
            } @else {
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>New category</span>
            }
          </button>
        }
      </header>

      <!-- ── TABS ──────────────────────────── -->
      <div class="tabs-row" role="tablist" aria-label="Catalog sections">
        <button role="tab" class="tab-btn" [class.tab-btn--active]="activeTab() === 'products'"
          [attr.aria-selected]="activeTab() === 'products'"
          (click)="setTab('products')" style="touch-action:manipulation">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.75" y="1.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/>
            <rect x="8.75" y="1.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/>
            <rect x="1.75" y="8.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/>
            <rect x="8.75" y="8.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Products
        </button>
        <button role="tab" class="tab-btn" [class.tab-btn--active]="activeTab() === 'categories'"
          [attr.aria-selected]="activeTab() === 'categories'"
          (click)="setTab('categories')" style="touch-action:manipulation">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Categories
        </button>
      </div>

      <!-- ════════════════════════════════════ -->
      <!-- PRODUCTS TAB                         -->
      <!-- ════════════════════════════════════ -->
      @if (activeTab() === 'products') {

        <!-- Add Product Form -->
        @if (showAddProduct()) {
          <div class="add-form-card" role="region" aria-label="Add new product">
            <h2 class="form-title">New product</h2>
            @if (addProductError()) {
              <p class="form-error" role="alert">{{ addProductError() }}</p>
            }
            <div class="form-grid">
              <div class="form-field form-field--wide">
                <label class="form-label" for="pName">Name <span class="req" aria-hidden="true">*</span></label>
                <input id="pName" class="form-input" type="text" placeholder="e.g. Premium Coffee Bag"
                  [value]="newName()" (input)="newName.set(getInputValue($event))" autocomplete="off"/>
              </div>
              <div class="form-field">
                <label class="form-label" for="pPrice">Price <span class="req" aria-hidden="true">*</span></label>
                <input id="pPrice" class="form-input" type="number" min="0" step="0.01" placeholder="0.00"
                  [value]="newPrice()" (input)="newPrice.set(getInputValue($event))"/>
              </div>
              <div class="form-field">
                <label class="form-label" for="pSku">SKU</label>
                <input id="pSku" class="form-input" type="text" placeholder="e.g. SKU-001"
                  [value]="newSku()" (input)="newSku.set(getInputValue($event))" autocomplete="off"/>
              </div>
              <div class="form-field">
                <label class="form-label" for="pUnit">Unit</label>
                <input id="pUnit" class="form-input" type="text" placeholder="e.g. unit, kg, hr"
                  [value]="newUnit()" (input)="newUnit.set(getInputValue($event))" autocomplete="off"/>
              </div>
              <div class="form-field form-field--type">
                <span class="form-label" id="pTypeLabel">Type <span class="req" aria-hidden="true">*</span></span>
                <div class="type-toggle" role="group" [attr.aria-labelledby]="'pTypeLabel'">
                  <button type="button" class="type-btn" [class.type-btn--active]="newType() === 'product'"
                    (click)="newType.set('product')" style="touch-action:manipulation">Product</button>
                  <button type="button" class="type-btn" [class.type-btn--active]="newType() === 'service'"
                    (click)="newType.set('service')" style="touch-action:manipulation">Service</button>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-ghost" (click)="cancelAddProduct()" style="touch-action:manipulation">Cancel</button>
              <button class="btn-primary" (click)="submitAddProduct()" [disabled]="addingProduct()" [attr.aria-busy]="addingProduct()" style="touch-action:manipulation">
                @if (addingProduct()) {
                  <span class="spinner" aria-hidden="true"></span><span>Adding…</span>
                } @else {
                  <span>Add product</span>
                }
              </button>
            </div>
          </div>
        }

        <!-- Search + Category filter -->
        <div class="product-toolbar">
          <div class="search-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.25" stroke="#5E566E" stroke-width="1.5"/>
              <path d="M11 11l2.5 2.5" stroke="#5E566E" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input type="search" class="search-input" placeholder="Search products…"
              [value]="search()" (input)="onSearchInput($event)" aria-label="Search products"/>
            @if (search()) {
              <button class="search-clear" (click)="clearSearch()" aria-label="Clear search" style="touch-action:manipulation">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Category filter chips -->
        @if (categories().length > 0) {
          <div class="cat-chips" role="group" aria-label="Filter by category">
            <button class="cat-chip" [class.cat-chip--active]="catFilter() === ''"
              (click)="setCatFilter('')" style="touch-action:manipulation">All</button>
            @for (cat of categories(); track cat.id) {
              <button class="cat-chip" [class.cat-chip--active]="catFilter() === cat.id"
                (click)="setCatFilter(cat.id)" style="touch-action:manipulation">{{ cat.name }}</button>
            }
          </div>
        }

        <!-- Products Error -->
        @if (errorProducts()) {
          <div class="error-bar" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ errorProducts() }}</span>
            <button class="error-retry" (click)="loadProducts()" style="touch-action:manipulation">Retry</button>
          </div>
        }

        <!-- Products Loading -->
        @if (loadingProducts()) {
          <div class="product-card" aria-busy="true" aria-label="Loading products">
            <div class="list-header" aria-hidden="true">
              <div class="col-pname">Name</div>
              <div class="col-pcat">Category</div>
              <div class="col-ptype">Type</div>
              <div class="col-pstock">Stock</div>
              <div class="col-pprice">Price</div>
              <div class="col-pstatus">Status</div>
            </div>
            @for (s of skeletons; track s) {
              <div class="skeleton-row">
                <div class="col-pname"><div class="skel skel-name"></div><div class="skel skel-sku"></div></div>
                <div class="col-pcat"><div class="skel skel-badge"></div></div>
                <div class="col-ptype"><div class="skel skel-badge"></div></div>
                <div class="col-pstock"><div class="skel skel-short"></div></div>
                <div class="col-pprice"><div class="skel skel-short" style="margin-left:auto"></div></div>
                <div class="col-pstatus"><div class="skel skel-badge" style="margin:0 auto"></div></div>
              </div>
            }
          </div>
        }

        <!-- Products Empty -->
        @else if (products().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="19" stroke="#B8A7FF" stroke-width="1.5" stroke-dasharray="4 3"/>
                <path d="M12 28l4-12 4 8 4-5 4 9" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            @if (search() || catFilter()) {
              <p class="empty-title">No products found</p>
              <p class="empty-sub">Try a different search or clear filters.</p>
              <button class="btn-ghost" (click)="resetFilters()" style="touch-action:manipulation">Clear filters</button>
            } @else {
              <p class="empty-title">No products yet</p>
              <p class="empty-sub">Add your first product to build your catalog.</p>
              <button class="btn-primary" (click)="toggleAddProduct()" style="touch-action:manipulation">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>New product</span>
              </button>
            }
          </div>
        }

        <!-- Products List -->
        @else {
          <div class="product-card">
            <div class="list-header" role="row">
              <div class="col-pname"  role="columnheader">Name</div>
              <div class="col-pcat"   role="columnheader">Category</div>
              <div class="col-ptype"  role="columnheader">Type</div>
              <div class="col-pstock" role="columnheader">Stock</div>
              <div class="col-pprice" role="columnheader">Price</div>
              <div class="col-pstatus" role="columnheader">Status</div>
            </div>
            <div role="list">
              @for (p of products(); track p.id) {
                <div class="product-row" role="listitem">
                  <div class="col-pname">
                    <span class="p-name">{{ p.name }}</span>
                    @if (p.sku) { <span class="p-sku">{{ p.sku }}</span> }
                  </div>
                  <div class="col-pcat">
                    @if (p.categoryId && categoryName(p.categoryId)) {
                      <span class="cat-label">{{ categoryName(p.categoryId) }}</span>
                    } @else {
                      <span class="cell-empty">—</span>
                    }
                  </div>
                  <div class="col-ptype">
                    <span class="type-badge" [class]="'type-badge--' + p.type">{{ p.type }}</span>
                  </div>
                  <div class="col-pstock">
                    @if (p.type === 'product' && p.stock != null) {
                      <span class="p-stock" [class.p-stock--low]="p.stock < 10">{{ p.stock }} {{ p.unit }}</span>
                    } @else {
                      <span class="cell-empty">—</span>
                    }
                  </div>
                  <div class="col-pprice">
                    <span class="p-price">{{ formatCurrency(p.price) }}</span>
                    @if (p.unit && p.type === 'service') {
                      <span class="p-unit">/ {{ p.unit }}</span>
                    }
                  </div>
                  <div class="col-pstatus">
                    <span class="status-dot" [class]="p.isActive ? 'status-dot--active' : 'status-dot--inactive'"
                      [attr.aria-label]="p.isActive ? 'Active' : 'Inactive'">
                      {{ p.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <nav class="pagination" aria-label="Pagination">
              <button class="page-btn" [disabled]="!hasPrev()" (click)="prevPage()" aria-label="Previous page" style="touch-action:manipulation">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3L6 8l4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Prev</span>
              </button>
              <span class="page-info">{{ pageStart() }}–{{ pageEnd() }} <span class="page-of">of</span> {{ totalProducts() | number }}</span>
              <button class="page-btn" [disabled]="!hasNext()" (click)="nextPage()" aria-label="Next page" style="touch-action:manipulation">
                <span>Next</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3l4 5-4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </nav>
          }
        }
      }

      <!-- ════════════════════════════════════ -->
      <!-- CATEGORIES TAB                       -->
      <!-- ════════════════════════════════════ -->
      @if (activeTab() === 'categories') {

        <!-- Add Category Form -->
        @if (showAddCategory()) {
          <div class="add-form-card" role="region" aria-label="Add new category">
            <h2 class="form-title">New category</h2>
            @if (addCatError()) {
              <p class="form-error" role="alert">{{ addCatError() }}</p>
            }
            <div class="form-grid">
              <div class="form-field form-field--wide">
                <label class="form-label" for="cName">Name <span class="req" aria-hidden="true">*</span></label>
                <input id="cName" class="form-input" type="text" placeholder="e.g. Beverages"
                  [value]="newCatName()" (input)="newCatName.set(getInputValue($event))" autocomplete="off"/>
              </div>
              <div class="form-field form-field--wide">
                <label class="form-label" for="cDesc">Description</label>
                <input id="cDesc" class="form-input" type="text" placeholder="Optional description"
                  [value]="newCatDesc()" (input)="newCatDesc.set(getInputValue($event))" autocomplete="off"/>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-ghost" (click)="cancelAddCategory()" style="touch-action:manipulation">Cancel</button>
              <button class="btn-primary" (click)="submitAddCategory()" [disabled]="addingCat()" [attr.aria-busy]="addingCat()" style="touch-action:manipulation">
                @if (addingCat()) {
                  <span class="spinner" aria-hidden="true"></span><span>Adding…</span>
                } @else {
                  <span>Add category</span>
                }
              </button>
            </div>
          </div>
        }

        <!-- Categories Error -->
        @if (errorCats()) {
          <div class="error-bar" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ errorCats() }}</span>
            <button class="error-retry" (click)="loadCategories()" style="touch-action:manipulation">Retry</button>
          </div>
        }

        <!-- Categories Loading -->
        @if (loadingCats()) {
          <div class="cat-grid" aria-busy="true" aria-label="Loading categories">
            @for (s of catSkeletons; track s) {
              <div class="cat-card-skel">
                <div class="skel skel-cat-title"></div>
                <div class="skel skel-cat-desc"></div>
              </div>
            }
          </div>
        }

        <!-- Categories Empty -->
        @else if (categories().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="19" stroke="#B8A7FF" stroke-width="1.5" stroke-dasharray="4 3"/>
                <path d="M10 14h20M10 20h14M10 26h8" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="empty-title">No categories yet</p>
            <p class="empty-sub">Organize your products with categories.</p>
            <button class="btn-primary" (click)="toggleAddCategory()" style="touch-action:manipulation">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>New category</span>
            </button>
          </div>
        }

        <!-- Categories Grid -->
        @else {
          <div class="cat-grid" role="list">
            @for (cat of categories(); track cat.id) {
              <div class="cat-card" role="listitem">
                <div class="cat-card-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 6h14M3 10h9M3 14h6" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="cat-card-body">
                  <span class="cat-card-name">{{ cat.name }}</span>
                  @if (cat.description) {
                    <span class="cat-card-desc">{{ cat.description }}</span>
                  }
                </div>
                <button class="cat-card-action" (click)="browseCategory(cat.id)" [attr.aria-label]="'Browse ' + cat.name + ' products'" style="touch-action:manipulation">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3l4 5-4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            }
          </div>
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
    @media (max-width: 640px) { .page { padding: 20px 16px 32px; } }

    /* ── HEADER ──────────────────────── */
    .page-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .head-left { display: flex; align-items: center; gap: 10px; }
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
    .btn-primary--active { background: rgba(35,26,51,0.12); color: var(--riverbed); box-shadow: none; }
    .btn-primary--active:hover:not(:disabled) { background: rgba(35,26,51,0.18); transform: none; box-shadow: none; }

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

    .spinner {
      width: 15px; height: 15px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── TABS ────────────────────────── */
    .tabs-row {
      display: flex;
      gap: 4px;
      border-bottom: 1.5px solid var(--border);
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 42px;
      padding: 0 16px;
      background: none;
      border: none;
      border-bottom: 2.5px solid transparent;
      margin-bottom: -1.5px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: var(--riverbed); }
    .tab-btn--active { color: var(--stream-ink); border-bottom-color: var(--stream-ink); }
    .tab-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 4px; }

    /* ── ADD FORM CARD ───────────────── */
    .add-form-card {
      background: rgba(138,118,232,0.04);
      border: 1.5px solid rgba(138,118,232,0.2);
      border-radius: 14px;
      padding: 20px 24px;
    }
    .form-title {
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 14px;
    }
    .form-error {
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      color: #b91c1c;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 14px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px 14px;
      margin-bottom: 16px;
    }
    .form-field { display: flex; flex-direction: column; gap: 5px; }
    .form-field--wide { grid-column: span 2; }
    @media (max-width: 640px) { .form-field--wide { grid-column: span 1; } }
    .form-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--riverbed);
    }
    .req { color: var(--current); margin-left: 2px; }
    .form-input {
      height: 40px;
      padding: 0 12px;
      border: 1.5px solid var(--border);
      border-radius: 9px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--riverbed);
      background: #fff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .form-input::placeholder { color: rgba(94,86,110,0.45); }
    .form-input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 3px rgba(138,118,232,0.12); }
    .form-input::-webkit-search-cancel-button { display: none; }

    /* Type toggle */
    .form-field--type { justify-content: flex-start; }
    .type-toggle {
      display: flex;
      background: rgba(35,26,51,0.06);
      border-radius: 8px;
      padding: 3px;
      gap: 2px;
      height: 40px;
      box-sizing: border-box;
      align-items: center;
    }
    .type-btn {
      flex: 1;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .type-btn:hover { color: var(--riverbed); }
    .type-btn--active { background: #fff; color: var(--riverbed); box-shadow: 0 1px 3px rgba(35,26,51,0.10); }
    .type-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-end;
    }

    /* ── TOOLBAR ─────────────────────── */
    .product-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
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
    .search-input::-webkit-search-cancel-button { display: none; }
    .search-clear {
      position: absolute;
      right: 6px; top: 50%;
      transform: translateY(-50%);
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer;
      color: var(--muted); border-radius: 6px;
      transition: color 0.15s, background 0.15s;
    }
    .search-clear:hover { color: var(--riverbed); background: rgba(35,26,51,0.06); }
    .search-clear:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: -2px; border-radius: 6px; }

    /* ── CATEGORY FILTER CHIPS ────────── */
    .cat-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .cat-chip {
      height: 32px;
      padding: 0 14px;
      border: 1.5px solid var(--border);
      border-radius: 999px;
      background: #fff;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .cat-chip:hover { border-color: var(--stream-ink); color: var(--riverbed); }
    .cat-chip--active { background: rgba(138,118,232,0.10); border-color: var(--stream-ink); color: var(--stream-ink); }
    .cat-chip:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 999px; }

    /* ── ERROR BAR ───────────────────── */
    .error-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      color: #b91c1c; font-family: 'Manrope', sans-serif; font-size: 0.875rem;
    }
    .error-retry {
      margin-left: auto;
      background: none; border: 1.5px solid #fca5a5; color: #b91c1c;
      padding: 3px 12px; border-radius: 6px;
      font-family: 'Manrope', sans-serif; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s; flex-shrink: 0;
    }
    .error-retry:hover { background: #fee2e2; }
    .error-retry:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 6px; }

    /* ── PRODUCT LIST CARD ───────────── */
    .product-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    /* ── LIST GRID ───────────────────── */
    .list-header,
    .product-row,
    .skeleton-row {
      display: grid;
      grid-template-columns: 2fr 1fr 110px 90px 110px 90px;
      align-items: center;
      gap: 0 14px;
      padding: 0 20px;
    }
    @media (max-width: 1024px) {
      .list-header, .product-row, .skeleton-row {
        grid-template-columns: 2fr 110px 110px 90px;
      }
      .col-pcat, .col-pstock { display: none; }
    }
    @media (max-width: 640px) {
      .list-header, .product-row, .skeleton-row {
        grid-template-columns: 1fr auto auto;
      }
      .col-pcat, .col-pstock, .col-ptype { display: none; }
    }

    .list-header {
      height: 44px;
      border-bottom: 1px solid var(--border);
      background: rgba(241,238,248,0.4);
    }
    .list-header > div {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem; font-weight: 700;
      color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .col-pprice { text-align: right; }
    .col-pstatus { text-align: center; }

    .product-row {
      min-height: 58px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .product-row:last-child { border-bottom: none; }
    .product-row:hover { background: rgba(138,118,232,0.03); }

    .col-pname { display: flex; flex-direction: column; gap: 3px; padding: 12px 0; }
    .p-name { font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600; color: var(--riverbed); }
    .p-sku { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--muted); letter-spacing: 0.04em; }

    .col-pcat, .col-ptype, .col-pstock { display: flex; align-items: center; }
    .col-pprice { display: flex; align-items: center; justify-content: flex-end; gap: 3px; }
    .col-pstatus { display: flex; align-items: center; justify-content: center; }

    .cat-label {
      font-family: 'Manrope', sans-serif; font-size: 0.8rem; color: var(--muted);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
    }
    .cell-empty { color: rgba(94,86,110,0.35); font-family: 'Manrope', sans-serif; font-size: 0.85rem; }

    /* Type badge */
    .type-badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 999px;
      font-family: 'Manrope', sans-serif; font-size: 0.73rem; font-weight: 700;
      text-transform: capitalize; letter-spacing: 0.03em; white-space: nowrap;
    }
    .type-badge--product { background: rgba(138,118,232,0.13); color: #6B54D6; }
    .type-badge--service  { background: rgba(255,107,44,0.12);  color: #D45012; }

    /* Stock */
    .p-stock { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--muted); }
    .p-stock--low { color: #b91c1c; }

    /* Price */
    .p-price { font-family: 'DM Mono', monospace; font-size: 0.875rem; font-weight: 500; color: var(--riverbed); }
    .p-unit { font-family: 'Manrope', sans-serif; font-size: 0.75rem; color: var(--muted); }

    /* Status dot */
    .status-dot {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: 'Manrope', sans-serif; font-size: 0.73rem; font-weight: 600;
      white-space: nowrap;
    }
    .status-dot::before {
      content: '';
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    }
    .status-dot--active { color: #1A8A52; }
    .status-dot--active::before { background: #22A565; }
    .status-dot--inactive { color: var(--muted); }
    .status-dot--inactive::before { background: rgba(94,86,110,0.4); }

    /* ── SKELETON ────────────────────── */
    @keyframes shimmer {
      from { background-position: -400px 0; }
      to   { background-position:  400px 0; }
    }
    .skel {
      border-radius: 6px;
      background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .skel-name  { height: 13px; width: 55%; margin-bottom: 5px; }
    .skel-sku   { height: 10px; width: 35%; }
    .skel-badge { width: 70px; height: 22px; border-radius: 999px; }
    .skel-short { height: 13px; width: 56px; }
    .skeleton-row { min-height: 58px; border-bottom: 1px solid var(--border); }
    .skeleton-row:last-child { border-bottom: none; }

    /* ── CATEGORIES GRID ─────────────── */
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    .cat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 14px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 14px;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .cat-card:hover { border-color: rgba(138,118,232,0.3); box-shadow: 0 2px 10px rgba(138,118,232,0.08); }
    .cat-card-icon {
      width: 40px; height: 40px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(138,118,232,0.10);
      border-radius: 10px;
    }
    .cat-card-body { flex: 1; min-width: 0; }
    .cat-card-name {
      display: block;
      font-family: 'Manrope', sans-serif; font-size: 0.9rem; font-weight: 700;
      color: var(--riverbed);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cat-card-desc {
      display: block;
      font-family: 'Manrope', sans-serif; font-size: 0.8rem;
      color: var(--muted);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      margin-top: 2px;
    }
    .cat-card-action {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer;
      color: var(--muted); border-radius: 8px; flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .cat-card-action:hover { background: rgba(138,118,232,0.10); color: var(--stream-ink); }
    .cat-card-action:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 8px; }

    /* Category skeleton */
    .cat-card-skel {
      padding: 16px 14px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 14px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .skel-cat-title { height: 14px; width: 60%; }
    .skel-cat-desc  { height: 11px; width: 80%; }

    /* ── EMPTY STATE ─────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px;
      padding: 64px 24px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(184,167,255,0.12); border-radius: 20px; margin-bottom: 4px;
    }
    .empty-title { font-family: 'Manrope', sans-serif; font-size: 1rem; font-weight: 700; color: var(--riverbed); margin: 0; }
    .empty-sub   { font-family: 'Manrope', sans-serif; font-size: 0.875rem; color: var(--muted); margin: 0; }

    /* ── PAGINATION ──────────────────── */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; }
    .page-btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px;
      background: #fff; border: 1.5px solid var(--border); border-radius: 8px;
      font-family: 'Manrope', sans-serif; font-size: 0.85rem; font-weight: 600;
      color: var(--riverbed); cursor: pointer; transition: border-color 0.15s, color 0.15s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--stream-ink); color: var(--stream-ink); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 8px; }
    .page-info { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--muted); }
    .page-of { color: rgba(94,86,110,0.6); }

    @media (prefers-reduced-motion: reduce) {
      .skel { animation: none; }
      .spinner { animation: none; opacity: 0.6; }
      .btn-primary, .product-row, .cat-card, .tab-btn, .page-btn { transition: none; }
    }
  `],
})
export class CatalogShellComponent implements OnInit {
  private svc = inject(CatalogService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  products    = signal<Product[]>([]);
  categories  = signal<CatalogCategory[]>([]);
  loadingProducts = signal(true);
  loadingCats     = signal(true);
  errorProducts   = signal('');
  errorCats       = signal('');
  activeTab   = signal<'products' | 'categories'>('products');
  search      = signal('');
  catFilter   = signal('');
  page        = signal(1);
  totalProducts = signal(0);

  // Add product form
  showAddProduct  = signal(false);
  newName  = signal('');
  newPrice = signal('');
  newType  = signal<'product' | 'service'>('product');
  newSku   = signal('');
  newUnit  = signal('unit');
  addingProduct    = signal(false);
  addProductError  = signal('');

  // Add category form
  showAddCategory = signal(false);
  newCatName = signal('');
  newCatDesc = signal('');
  addingCat      = signal(false);
  addCatError    = signal('');

  readonly PAGE_SIZE   = 20;
  readonly skeletons   = Array.from({ length: 8 }, (_, i) => i);
  readonly catSkeletons = Array.from({ length: 6 }, (_, i) => i);

  totalPages = computed(() => Math.ceil(this.totalProducts() / this.PAGE_SIZE) || 1);
  hasPrev    = computed(() => this.page() > 1);
  hasNext    = computed(() => this.page() < this.totalPages());
  pageStart  = computed(() => this.totalProducts() === 0 ? 0 : (this.page() - 1) * this.PAGE_SIZE + 1);
  pageEnd    = computed(() => Math.min(this.page() * this.PAGE_SIZE, this.totalProducts()));

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts() {
    this.loadingProducts.set(true);
    this.errorProducts.set('');
    this.svc.getProducts({ search: this.search(), categoryId: this.catFilter() }).subscribe({
      next: (res) => {
        this.products.set(res.data.data);
        this.totalProducts.set(res.data.total);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.errorProducts.set('Failed to load products. Please try again.');
        this.loadingProducts.set(false);
      },
    });
  }

  loadCategories() {
    this.loadingCats.set(true);
    this.errorCats.set('');
    this.svc.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data as CatalogCategory[]);
        this.loadingCats.set(false);
      },
      error: () => {
        this.errorCats.set('Failed to load categories. Please try again.');
        this.loadingCats.set(false);
      },
    });
  }

  setTab(tab: 'products' | 'categories') {
    this.activeTab.set(tab);
    this.showAddProduct.set(false);
    this.showAddCategory.set(false);
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.search.set(val);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.loadProducts(); }, 300);
  }

  clearSearch() { this.search.set(''); this.page.set(1); this.loadProducts(); }

  setCatFilter(catId: string) { this.catFilter.set(catId); this.page.set(1); this.loadProducts(); }

  resetFilters() { this.search.set(''); this.catFilter.set(''); this.page.set(1); this.loadProducts(); }

  prevPage() { if (this.hasPrev()) { this.page.update(p => p - 1); this.loadProducts(); } }
  nextPage() { if (this.hasNext()) { this.page.update(p => p + 1); this.loadProducts(); } }

  // Add product
  toggleAddProduct() {
    this.showAddProduct.update(v => !v);
    this.addProductError.set('');
  }

  cancelAddProduct() {
    this.showAddProduct.set(false);
    this.newName.set(''); this.newPrice.set('');
    this.newSku.set(''); this.newUnit.set('unit');
    this.newType.set('product');
    this.addProductError.set('');
  }

  submitAddProduct() {
    const name  = this.newName().trim();
    const price = parseFloat(this.newPrice());
    if (!name) { this.addProductError.set('Product name is required.'); return; }
    if (isNaN(price) || price < 0) { this.addProductError.set('Enter a valid price (0 or greater).'); return; }
    this.addingProduct.set(true);
    this.addProductError.set('');
    this.svc.createProduct({
      name, price,
      type: this.newType(),
      sku:  this.newSku().trim() || undefined,
      unit: this.newUnit().trim() || 'unit',
      isActive: true,
    }).subscribe({
      next: (res) => {
        this.products.update(p => [res.data as Product, ...p]);
        this.totalProducts.update(t => t + 1);
        this.cancelAddProduct();
        this.addingProduct.set(false);
      },
      error: () => {
        this.addProductError.set('Failed to create product. Please try again.');
        this.addingProduct.set(false);
      },
    });
  }

  // Add category
  toggleAddCategory() {
    this.showAddCategory.update(v => !v);
    this.addCatError.set('');
  }

  cancelAddCategory() {
    this.showAddCategory.set(false);
    this.newCatName.set(''); this.newCatDesc.set('');
    this.addCatError.set('');
  }

  submitAddCategory() {
    const name = this.newCatName().trim();
    if (!name) { this.addCatError.set('Category name is required.'); return; }
    this.addingCat.set(true);
    this.addCatError.set('');
    this.svc.createCategory({ name, description: this.newCatDesc().trim() || undefined }).subscribe({
      next: (res) => {
        this.categories.update(c => [...c, res.data as CatalogCategory]);
        this.cancelAddCategory();
        this.addingCat.set(false);
      },
      error: () => {
        this.addCatError.set('Failed to create category. Please try again.');
        this.addingCat.set(false);
      },
    });
  }

  // Browse category: set filter and switch to products tab
  browseCategory(catId: string) {
    this.catFilter.set(catId);
    this.page.set(1);
    this.activeTab.set('products');
    this.loadProducts();
  }

  categoryName(catId: string): string {
    return this.categories().find(c => c.id === catId)?.name ?? '';
  }

  formatCurrency(n: number): string {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
