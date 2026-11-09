import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MapService } from './map.service';
import { Floor, Table } from '../../shared/types';

const STATUS_COLORS: Record<string, string> = {
  available: '#22A565',
  occupied:  '#ef4444',
  reserved:  '#f59e0b',
  inactive:  '#94a3b8',
};

@Component({
  selector: 'app-map-editor',
  standalone: true,
  imports: [],
  template: `
    <div class="page">

      <!-- ── PAGE HEADER ───────────────────── -->
      <header class="page-head">
        <div class="head-left">
          <h1 class="page-title">Floor Map</h1>
          @if (!loadingFloors() && floors().length > 0) {
            <span class="count-pill">{{ floors().length }} floor{{ floors().length === 1 ? '' : 's' }}</span>
          }
        </div>
        <div class="head-actions">
          <button class="btn-ghost" (click)="toggleAddFloor()" [class.btn-ghost--cancel]="showAddFloor()" style="touch-action:manipulation">
            @if (showAddFloor()) { <span>Cancel</span> } @else {
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Add floor</span>
            }
          </button>
          <button class="btn-primary" (click)="toggleAddTable()"
            [disabled]="!selectedFloorId()"
            [class.btn-primary--cancel]="showAddTable()"
            style="touch-action:manipulation">
            @if (showAddTable()) { <span>Cancel</span> } @else {
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Add table</span>
            }
          </button>
        </div>
      </header>

      <!-- ── FLOOR TABS ─────────────────────── -->
      @if (!loadingFloors() && floors().length > 0) {
        <div class="floor-tabs-wrap">
          <div class="floor-tabs" role="tablist" aria-label="Select floor">
            @for (floor of floors(); track floor.id) {
              <button role="tab" class="floor-tab"
                [class.floor-tab--active]="selectedFloorId() === floor.id"
                [attr.aria-selected]="selectedFloorId() === floor.id"
                (click)="setFloor(floor.id)"
                style="touch-action:manipulation">
                {{ floor.name }}
                <span class="floor-level">L{{ floor.level }}</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- ── ADD FLOOR FORM ─────────────────── -->
      @if (showAddFloor()) {
        <div class="add-form-card" role="region" aria-label="Add floor">
          <h2 class="form-title">New floor</h2>
          @if (addFloorError()) {
            <p class="form-error" role="alert">{{ addFloorError() }}</p>
          }
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="floorName">Name <span class="req" aria-hidden="true">*</span></label>
              <input id="floorName" class="form-input" type="text" placeholder="e.g. Ground Floor"
                [value]="newFloorName()" (input)="newFloorName.set(getVal($event))" autocomplete="off"/>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-ghost" (click)="cancelAddFloor()" style="touch-action:manipulation">Cancel</button>
            <button class="btn-primary" (click)="submitAddFloor()" [disabled]="addingFloor()" [attr.aria-busy]="addingFloor()" style="touch-action:manipulation">
              @if (addingFloor()) { <span class="spinner" aria-hidden="true"></span><span>Adding…</span> }
              @else { <span>Add floor</span> }
            </button>
          </div>
        </div>
      }

      <!-- ── ADD TABLE FORM ─────────────────── -->
      @if (showAddTable() && selectedFloorId()) {
        <div class="add-form-card" role="region" aria-label="Add table">
          <h2 class="form-title">New table</h2>
          @if (addTableError()) {
            <p class="form-error" role="alert">{{ addTableError() }}</p>
          }
          <div class="form-row">
            <div class="form-field">
              <label class="form-label" for="tableLabel">Label <span class="req" aria-hidden="true">*</span></label>
              <input id="tableLabel" class="form-input" type="text" placeholder="e.g. T1"
                [value]="newTableLabel()" (input)="newTableLabel.set(getVal($event))" autocomplete="off"/>
            </div>
            <div class="form-field">
              <label class="form-label" for="tableCap">Seats <span class="req" aria-hidden="true">*</span></label>
              <input id="tableCap" class="form-input" type="number" min="1" max="50" placeholder="4"
                [value]="newTableCapacity()" (input)="newTableCapacity.set(getVal($event))"/>
            </div>
            <div class="form-field">
              <span class="form-label" id="shapeLabel">Shape</span>
              <div class="shape-toggle" role="group" aria-labelledby="shapeLabel">
                <button type="button" class="shape-btn" [class.shape-btn--active]="newTableShape() === 'rect'"
                  (click)="newTableShape.set('rect')" style="touch-action:manipulation">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  Rect
                </button>
                <button type="button" class="shape-btn" [class.shape-btn--active]="newTableShape() === 'circle'"
                  (click)="newTableShape.set('circle')" style="touch-action:manipulation">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  Round
                </button>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-ghost" (click)="cancelAddTable()" style="touch-action:manipulation">Cancel</button>
            <button class="btn-primary" (click)="submitAddTable()" [disabled]="addingTable()" [attr.aria-busy]="addingTable()" style="touch-action:manipulation">
              @if (addingTable()) { <span class="spinner" aria-hidden="true"></span><span>Adding…</span> }
              @else { <span>Add table</span> }
            </button>
          </div>
        </div>
      }

      <!-- ── ERROR BARS ─────────────────────── -->
      @if (errorFloors()) {
        <div class="error-bar" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ errorFloors() }}</span>
          <button class="error-retry" (click)="reloadFloors()" style="touch-action:manipulation">Retry</button>
        </div>
      }
      @if (errorTables()) {
        <div class="error-bar" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ errorTables() }}</span>
          <button class="error-retry" (click)="setFloor(selectedFloorId())" style="touch-action:manipulation">Retry</button>
        </div>
      }

      <!-- ── CANVAS SECTION ─────────────────── -->
      <div class="canvas-section">

        <!-- No floors yet -->
        @if (!loadingFloors() && floors().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="19" stroke="#B8A7FF" stroke-width="1.5" stroke-dasharray="4 3"/>
                <rect x="10" y="12" width="20" height="16" rx="2.5" stroke="#8A76E8" stroke-width="1.5"/>
                <path d="M14 12v16M26 12v16M10 20h20" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="empty-title">No floors yet</p>
            <p class="empty-sub">Add a floor to start building your map.</p>
            <button class="btn-primary" (click)="toggleAddFloor()" style="touch-action:manipulation">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Add floor</span>
            </button>
          </div>
        }

        <!-- Floors loading -->
        @else if (loadingFloors()) {
          <div class="canvas-loading" aria-label="Loading map" aria-busy="true">
            <div class="loading-pulse"></div>
          </div>
        }

        <!-- Floor selected — show canvas -->
        @else if (selectedFloorId()) {
          <div class="canvas-wrapper" (pointerdown)="onCanvasBgDown($event)">

            <!-- Tables loading overlay -->
            @if (loadingTables()) {
              <div class="canvas-loading-overlay" aria-label="Loading tables" aria-busy="true">
                <div class="loading-pulse"></div>
              </div>
            }

            <!-- Dot-grid canvas -->
            <div class="canvas-area"
              [style.width.px]="canvasW()"
              [style.height.px]="canvasH()"
              role="application"
              [attr.aria-label]="'Floor map: ' + (currentFloor()?.name ?? '') + '. ' + tables().length + ' tables. Use Tab to focus tables, Arrow keys to move selected table.'">

              @for (table of tables(); track table.id) {
                <div class="table-item"
                  [class.table-item--circle]="table.shape === 'circle'"
                  [class.table-item--selected]="selectedTableId() === table.id"
                  [class.table-item--dragging]="isDragging() && selectedTableId() === table.id"
                  [style.left.px]="table.x"
                  [style.top.px]="table.y"
                  [style.width.px]="table.width"
                  [style.height.px]="table.height"
                  [style.background]="tableStatusColor(table.status)"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Table ' + table.label + ', ' + table.capacity + ' seats, ' + table.status + '. Use arrow keys to move.'"
                  [attr.aria-pressed]="selectedTableId() === table.id"
                  (pointerdown)="onTablePointerDown($event, table)"
                  (pointermove)="onTablePointerMove($event, table)"
                  (pointerup)="onTablePointerUp($event, table)"
                  (pointercancel)="onTablePointerUp($event, table)"
                  (keydown)="onTableKeyDown($event, table)"
                >
                  <span class="table-label">{{ table.label }}</span>
                  <span class="table-cap">{{ table.capacity }}p</span>
                </div>
              }

              <!-- Empty canvas state -->
              @if (!loadingTables() && tables().length === 0) {
                <div class="canvas-empty">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <rect x="2" y="6" width="28" height="20" rx="3" stroke="rgba(35,26,51,0.15)" stroke-width="1.5" stroke-dasharray="4 3"/>
                    <path d="M16 11v10M11 16h10" stroke="rgba(35,26,51,0.2)" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <p>No tables on this floor. Click "Add table" to place one.</p>
                </div>
              }
            </div>
          </div>

          <!-- ── SELECTION BAR ──────────────── -->
          @if (selectedTable()) {
            <div class="selection-bar" role="region" [attr.aria-label]="'Selected: ' + selectedTable()!.label">
              <div class="sel-info">
                <span class="sel-name">{{ selectedTable()!.label }}</span>
                <span class="sel-meta">{{ selectedTable()!.capacity }} seats</span>
                <span class="sel-hint">Arrow keys to move · Shift+Arrow for ×4 · Esc to deselect</span>
              </div>
              <div class="sel-statuses" role="group" aria-label="Change status">
                @for (s of statusOptions; track s.value) {
                  <button class="sel-status-btn"
                    [class.sel-status-btn--active]="selectedTable()!.status === s.value"
                    [style.--dot-color]="s.color"
                    (click)="setTableStatus(s.value)"
                    [attr.aria-pressed]="selectedTable()!.status === s.value"
                    style="touch-action:manipulation">
                    {{ s.label }}
                  </button>
                }
              </div>
              <button class="sel-close" (click)="deselectAll()" aria-label="Deselect table" style="touch-action:manipulation">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          }

          <!-- ── STATUS LEGEND ──────────────── -->
          <div class="legend" role="list" aria-label="Table status legend">
            @for (s of statusOptions; track s.value) {
              <div class="legend-item" role="listitem">
                <span class="legend-dot" [style.background]="s.color" aria-hidden="true"></span>
                <span class="legend-label">{{ s.label }}</span>
              </div>
            }
          </div>
        }

        <!-- No floor selected (floors exist) -->
        @else {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="19" stroke="#B8A7FF" stroke-width="1.5" stroke-dasharray="4 3"/>
                <path d="M13 20h14M13 14h10M13 26h8" stroke="#8A76E8" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="empty-title">Select a floor</p>
            <p class="empty-sub">Choose a floor above to view and edit its map.</p>
          </div>
        }

      </div><!-- /canvas-section -->

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
      display: block;
      height: 100%;
    }

    /* ── PAGE ─────────────────────────── */
    .page {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 24px 28px 20px;
      gap: 16px;
      box-sizing: border-box;
      overflow: hidden;
    }
    @media (max-width: 640px) { .page { padding: 16px 16px 12px; gap: 12px; } }

    /* ── HEADER ──────────────────────── */
    .page-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    .head-left { display: flex; align-items: center; gap: 10px; }
    .page-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .count-pill {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--stream-ink);
      background: rgba(138,118,232,0.12);
      border-radius: 999px;
      padding: 2px 10px;
    }
    .head-actions { display: flex; gap: 8px; align-items: center; }

    /* ── BUTTONS ─────────────────────── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 16px;
      background: var(--stream-ink); color: #fff; border: none;
      border-radius: 10px; font-family: 'Manrope', sans-serif;
      font-size: 0.875rem; font-weight: 700; cursor: pointer;
      transition: background 0.18s, transform 0.12s;
      box-shadow: 0 2px 8px rgba(138,118,232,0.3);
      white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #7460d4; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: 10px; }
    .btn-primary--cancel { background: rgba(35,26,51,0.1); color: var(--riverbed); box-shadow: none; }
    .btn-primary--cancel:hover:not(:disabled) { background: rgba(35,26,51,0.15); transform: none; }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 16px;
      background: transparent; color: var(--stream-ink);
      border: 1.5px solid rgba(138,118,232,0.35); border-radius: 10px;
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.18s, border-color 0.18s;
      white-space: nowrap;
    }
    .btn-ghost:hover { background: rgba(138,118,232,0.07); border-color: var(--stream-ink); }
    .btn-ghost:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: 10px; }
    .btn-ghost--cancel { border-color: rgba(35,26,51,0.2); color: var(--muted); }
    .btn-ghost--cancel:hover { background: rgba(35,26,51,0.05); border-color: rgba(35,26,51,0.3); }

    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── FLOOR TABS ──────────────────── */
    .floor-tabs-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      flex-shrink: 0;
    }
    .floor-tabs-wrap::-webkit-scrollbar { display: none; }
    .floor-tabs {
      display: inline-flex;
      gap: 6px;
      background: rgba(35,26,51,0.05);
      border-radius: 12px;
      padding: 4px;
      min-width: max-content;
    }
    .floor-tab {
      display: inline-flex; align-items: center; gap: 6px;
      height: 34px; padding: 0 14px;
      border: none; background: transparent; border-radius: 9px;
      font-family: 'Manrope', sans-serif; font-size: 0.82rem; font-weight: 600;
      color: var(--muted); cursor: pointer;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .floor-tab:hover { color: var(--riverbed); }
    .floor-tab--active { background: #fff; color: var(--riverbed); box-shadow: 0 1px 4px rgba(35,26,51,0.10); }
    .floor-tab:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 9px; }
    .floor-level {
      font-family: 'DM Mono', monospace; font-size: 0.7rem;
      background: rgba(35,26,51,0.08); border-radius: 4px;
      padding: 1px 5px; color: var(--muted);
    }
    .floor-tab--active .floor-level { background: rgba(138,118,232,0.12); color: var(--stream-ink); }

    /* ── ADD FORMS ───────────────────── */
    .add-form-card {
      background: rgba(138,118,232,0.04);
      border: 1.5px solid rgba(138,118,232,0.2);
      border-radius: 14px; padding: 16px 20px;
      flex-shrink: 0;
    }
    .form-title {
      font-family: 'Manrope', sans-serif; font-size: 0.9rem; font-weight: 700;
      color: var(--riverbed); margin: 0 0 12px;
    }
    .form-error {
      font-family: 'Manrope', sans-serif; font-size: 0.82rem; color: #b91c1c;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      padding: 7px 12px; margin-bottom: 12px;
    }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .form-field { display: flex; flex-direction: column; gap: 5px; min-width: 140px; }
    .form-label { font-family: 'Manrope', sans-serif; font-size: 0.78rem; font-weight: 600; color: var(--riverbed); }
    .req { color: var(--current); margin-left: 2px; }
    .form-input {
      height: 38px; padding: 0 11px;
      border: 1.5px solid var(--border); border-radius: 9px;
      font-family: 'Manrope', sans-serif; font-size: 0.875rem;
      color: var(--riverbed); background: #fff; outline: none;
      box-sizing: border-box; transition: border-color 0.18s, box-shadow 0.18s;
    }
    .form-input::placeholder { color: rgba(94,86,110,0.45); }
    .form-input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 3px rgba(138,118,232,0.12); }

    /* Shape toggle */
    .shape-toggle { display: flex; background: rgba(35,26,51,0.06); border-radius: 8px; padding: 3px; gap: 2px; height: 38px; box-sizing: border-box; align-items: center; }
    .shape-btn {
      display: inline-flex; align-items: center; gap: 5px;
      flex: 1; height: 30px; padding: 0 10px;
      border: none; background: transparent; border-radius: 6px;
      font-family: 'Manrope', sans-serif; font-size: 0.78rem; font-weight: 600;
      color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .shape-btn:hover { color: var(--riverbed); }
    .shape-btn--active { background: #fff; color: var(--riverbed); box-shadow: 0 1px 3px rgba(35,26,51,0.10); }
    .shape-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }

    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }

    /* ── ERROR BAR ───────────────────── */
    .error-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 14px; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; color: #b91c1c;
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; flex-shrink: 0;
    }
    .error-retry {
      margin-left: auto; background: none; border: 1.5px solid #fca5a5; color: #b91c1c;
      padding: 2px 10px; border-radius: 6px; font-family: 'Manrope', sans-serif;
      font-size: 0.78rem; font-weight: 600; cursor: pointer; flex-shrink: 0;
    }
    .error-retry:hover { background: #fee2e2; }
    .error-retry:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 6px; }

    /* ── CANVAS SECTION ──────────────── */
    .canvas-section {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .canvas-wrapper {
      flex: 1;
      min-height: 300px;
      overflow: auto;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      background: #fff;
      position: relative;
      -webkit-overflow-scrolling: touch;
      touch-action: none; /* prevent scroll while dragging tables */
      scrollbar-width: thin;
      scrollbar-color: rgba(138,118,232,0.2) transparent;
    }

    .canvas-area {
      position: relative;
      background-image: radial-gradient(circle, rgba(35,26,51,0.12) 1px, transparent 1px);
      background-size: 40px 40px;
      background-color: #fdfcff;
      user-select: none;
    }

    /* ── TABLE ITEMS ─────────────────── */
    .table-item {
      position: absolute;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: grab;
      color: #fff;
      gap: 2px;
      box-shadow: 0 2px 8px rgba(35,26,51,0.2);
      transition: box-shadow 0.15s, outline 0.1s;
      touch-action: none;
    }
    .table-item:focus-visible {
      outline: 3px solid var(--stream-ink);
      outline-offset: 3px;
    }
    .table-item--circle { border-radius: 50%; }
    .table-item--selected {
      outline: 3px solid var(--stream-ink);
      outline-offset: 3px;
      box-shadow: 0 4px 16px rgba(35,26,51,0.25);
      z-index: 10;
    }
    .table-item--dragging {
      cursor: grabbing;
      box-shadow: 0 8px 24px rgba(35,26,51,0.3);
      z-index: 20;
      opacity: 0.92;
    }
    .table-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      line-height: 1;
      pointer-events: none;
    }
    .table-cap {
      font-family: 'DM Mono', monospace;
      font-size: 0.68rem;
      opacity: 0.85;
      pointer-events: none;
    }

    /* Canvas empty state */
    .canvas-empty {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 10px; pointer-events: none;
    }
    .canvas-empty p {
      font-family: 'Manrope', sans-serif; font-size: 0.875rem;
      color: rgba(35,26,51,0.3); text-align: center; max-width: 240px;
    }

    /* Canvas loading overlay */
    .canvas-loading-overlay {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      z-index: 30; border-radius: 14px;
    }

    /* Generic loading */
    .canvas-loading {
      flex: 1; min-height: 300px;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid var(--border); border-radius: 16px;
    }
    @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
    .loading-pulse {
      width: 40px; height: 40px;
      border: 3px solid rgba(138,118,232,0.3);
      border-top-color: var(--stream-ink);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }

    /* ── SELECTION BAR ───────────────── */
    .selection-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--riverbed);
      border-radius: 12px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .sel-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .sel-name {
      font-family: 'DM Mono', monospace; font-size: 0.875rem; font-weight: 500;
      color: #fff; white-space: nowrap;
    }
    .sel-meta {
      font-family: 'Manrope', sans-serif; font-size: 0.8rem; color: rgba(255,255,255,0.55);
      white-space: nowrap;
    }
    .sel-hint {
      font-family: 'Manrope', sans-serif; font-size: 0.75rem; color: rgba(255,255,255,0.38);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    @media (max-width: 640px) { .sel-hint { display: none; } }

    .sel-statuses { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
    .sel-status-btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 30px; padding: 0 12px;
      border: 1.5px solid rgba(255,255,255,0.15); border-radius: 999px;
      background: transparent; color: rgba(255,255,255,0.6);
      font-family: 'Manrope', sans-serif; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .sel-status-btn::before {
      content: ''; width: 7px; height: 7px;
      border-radius: 50%; background: var(--dot-color);
      flex-shrink: 0;
    }
    .sel-status-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
    .sel-status-btn--active { border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.12); color: #fff; }
    .sel-status-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 999px; }

    .sel-close {
      width: 32px; height: 32px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.08); border: none; border-radius: 8px;
      color: rgba(255,255,255,0.55); cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .sel-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .sel-close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 8px; }

    /* ── LEGEND ──────────────────────── */
    .legend {
      display: flex; gap: 16px; flex-wrap: wrap;
      flex-shrink: 0; padding: 2px 0;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(35,26,51,0.2);
    }
    .legend-label {
      font-family: 'Manrope', sans-serif; font-size: 0.78rem; font-weight: 600;
      color: var(--muted); text-transform: capitalize;
    }

    /* ── EMPTY STATE ─────────────────── */
    .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12px; text-align: center; padding: 40px 24px;
    }
    .empty-icon {
      width: 72px; height: 72px; display: flex;
      align-items: center; justify-content: center;
      background: rgba(184,167,255,0.12); border-radius: 20px; margin-bottom: 4px;
    }
    .empty-title { font-family: 'Manrope', sans-serif; font-size: 1rem; font-weight: 700; color: var(--riverbed); margin: 0; }
    .empty-sub   { font-family: 'Manrope', sans-serif; font-size: 0.875rem; color: var(--muted); margin: 0; }

    @media (prefers-reduced-motion: reduce) {
      .table-item, .floor-tab, .sel-status-btn, .btn-primary { transition: none; }
      .spinner, .loading-pulse { animation: none; opacity: 0.6; }
    }
  `],
})
export class MapEditorComponent implements OnInit {
  private svc = inject(MapService);

  private dragState: {
    tableId: string;
    startPtrX: number; startPtrY: number;
    origX: number; origY: number;
    moved: boolean;
  } | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  floors           = signal<Floor[]>([]);
  tables           = signal<Table[]>([]);
  selectedFloorId  = signal('');
  selectedTableId  = signal<string | null>(null);
  isDragging       = signal(false);
  loadingFloors    = signal(true);
  loadingTables    = signal(false);
  errorFloors      = signal('');
  errorTables      = signal('');

  showAddFloor    = signal(false);
  newFloorName    = signal('');
  addingFloor     = signal(false);
  addFloorError   = signal('');

  showAddTable       = signal(false);
  newTableLabel      = signal('');
  newTableCapacity   = signal('4');
  newTableShape      = signal<'rect' | 'circle'>('rect');
  addingTable        = signal(false);
  addTableError      = signal('');

  currentFloor   = computed(() => this.floors().find(f => f.id === this.selectedFloorId()));
  selectedTable  = computed(() => this.tables().find(t => t.id === this.selectedTableId()));
  canvasW        = computed(() => this.currentFloor()?.widthPx  ?? 1200);
  canvasH        = computed(() => this.currentFloor()?.heightPx ?? 800);

  readonly statusOptions = [
    { value: 'available' as const, label: 'Available', color: STATUS_COLORS['available'] },
    { value: 'occupied'  as const, label: 'Occupied',  color: STATUS_COLORS['occupied']  },
    { value: 'reserved'  as const, label: 'Reserved',  color: STATUS_COLORS['reserved']  },
    { value: 'inactive'  as const, label: 'Inactive',  color: STATUS_COLORS['inactive']  },
  ];

  ngOnInit() {
    this.svc.getFloors().subscribe({
      next: (res) => {
        const floors = res.data as Floor[];
        this.floors.set(floors);
        this.loadingFloors.set(false);
        if (floors.length > 0) this.setFloor(floors[0].id);
      },
      error: () => {
        this.errorFloors.set('Failed to load floors. Please try again.');
        this.loadingFloors.set(false);
      },
    });
  }

  reloadFloors() {
    this.loadingFloors.set(true);
    this.errorFloors.set('');
    this.ngOnInit();
  }

  setFloor(floorId: string) {
    this.selectedFloorId.set(floorId);
    this.selectedTableId.set(null);
    this.loadingTables.set(true);
    this.errorTables.set('');
    this.svc.getTables(floorId).subscribe({
      next:  (res) => { this.tables.set(res.data as Table[]); this.loadingTables.set(false); },
      error: ()    => { this.errorTables.set('Failed to load tables.'); this.loadingTables.set(false); },
    });
  }

  // ── Add floor ────────────────────────
  toggleAddFloor() { this.showAddFloor.update(v => !v); this.addFloorError.set(''); }

  cancelAddFloor() {
    this.showAddFloor.set(false); this.newFloorName.set(''); this.addFloorError.set('');
  }

  submitAddFloor() {
    const name = this.newFloorName().trim();
    if (!name) { this.addFloorError.set('Floor name is required.'); return; }
    this.addingFloor.set(true);
    this.svc.createFloor({ name, level: this.floors().length }).subscribe({
      next: (res) => {
        const floor = res.data as Floor;
        this.floors.update(f => [...f, floor]);
        this.cancelAddFloor();
        this.addingFloor.set(false);
        this.setFloor(floor.id);
      },
      error: () => { this.addFloorError.set('Failed to create floor.'); this.addingFloor.set(false); },
    });
  }

  // ── Add table ────────────────────────
  toggleAddTable() { this.showAddTable.update(v => !v); this.addTableError.set(''); }

  cancelAddTable() {
    this.showAddTable.set(false);
    this.newTableLabel.set(''); this.newTableCapacity.set('4');
    this.newTableShape.set('rect'); this.addTableError.set('');
  }

  submitAddTable() {
    const label    = this.newTableLabel().trim();
    const capacity = parseInt(this.newTableCapacity(), 10);
    if (!label)                          { this.addTableError.set('Table label is required.'); return; }
    if (isNaN(capacity) || capacity < 1) { this.addTableError.set('Seats must be at least 1.'); return; }
    this.addingTable.set(true);
    const size = this.newTableShape() === 'circle' ? 72 : 80;
    this.svc.createTable(this.selectedFloorId(), {
      label, capacity, shape: this.newTableShape(),
      x: 40, y: 40, width: size, height: size,
      status: 'available',
    }).subscribe({
      next: (res) => {
        this.tables.update(t => [...t, res.data as Table]);
        this.cancelAddTable();
        this.addingTable.set(false);
      },
      error: () => { this.addTableError.set('Failed to create table.'); this.addingTable.set(false); },
    });
  }

  // ── Drag & Drop ──────────────────────
  onTablePointerDown(event: PointerEvent, table: Table) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedTableId.set(table.id);
    this.dragState = {
      tableId: table.id,
      startPtrX: event.clientX,
      startPtrY: event.clientY,
      origX: table.x,
      origY: table.y,
      moved: false,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onTablePointerMove(event: PointerEvent, table: Table) {
    if (!this.dragState || this.dragState.tableId !== table.id) return;
    const dx = event.clientX - this.dragState.startPtrX;
    const dy = event.clientY - this.dragState.startPtrY;
    if (!this.dragState.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    this.dragState.moved = true;
    this.isDragging.set(true);
    const maxX = this.canvasW() - table.width;
    const maxY = this.canvasH() - table.height;
    const newX = Math.max(0, Math.min(maxX, this.dragState.origX + dx));
    const newY = Math.max(0, Math.min(maxY, this.dragState.origY + dy));
    this.tables.update(ts => ts.map(t => t.id === table.id ? { ...t, x: newX, y: newY } : t));
  }

  onTablePointerUp(event: PointerEvent, table: Table) {
    if (!this.dragState || this.dragState.tableId !== table.id) return;
    if (this.dragState.moved) {
      const t = this.tables().find(t => t.id === table.id);
      if (t) this.svc.updateTable(t.id, { x: t.x, y: t.y }).subscribe();
    }
    this.dragState = null;
    this.isDragging.set(false);
  }

  // Canvas background click: deselect
  onCanvasBgDown(event: PointerEvent) {
    if (event.target === event.currentTarget) this.selectedTableId.set(null);
  }

  // ── Keyboard alternative (WCAG 2.2 AA) ──
  onTableKeyDown(event: KeyboardEvent, table: Table) {
    const step = event.shiftKey ? 40 : 10;
    let dx = 0, dy = 0;
    switch (event.key) {
      case 'ArrowLeft':  dx = -step; break;
      case 'ArrowRight': dx =  step; break;
      case 'ArrowUp':    dy = -step; break;
      case 'ArrowDown':  dy =  step; break;
      case 'Escape': this.selectedTableId.set(null); return;
      default: return;
    }
    event.preventDefault();
    const maxX = this.canvasW() - table.width;
    const maxY = this.canvasH() - table.height;
    const newX = Math.max(0, Math.min(maxX, table.x + dx));
    const newY = Math.max(0, Math.min(maxY, table.y + dy));
    this.tables.update(ts => ts.map(t => t.id === table.id ? { ...t, x: newX, y: newY } : t));
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      const t = this.tables().find(t => t.id === table.id);
      if (t) this.svc.updateTable(t.id, { x: t.x, y: t.y }).subscribe();
    }, 600);
  }

  deselectAll() { this.selectedTableId.set(null); }

  setTableStatus(status: Table['status']) {
    const tableId = this.selectedTableId();
    if (!tableId) return;
    this.tables.update(ts => ts.map(t => t.id === tableId ? { ...t, status } : t));
    this.svc.updateTable(tableId, { status }).subscribe();
  }

  tableStatusColor(status: string): string {
    return STATUS_COLORS[status] ?? '#8A76E8';
  }

  getVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
