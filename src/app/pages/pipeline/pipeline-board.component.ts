import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PipelineService } from './pipeline.service';
import { PipelineStage, Deal } from '../../shared/types';

const STAGE_COLORS = ['#8A76E8','#FF6B2C','#22A565','#3B82F6','#F59E0B','#EC4899','#6366F1'];

@Component({
  selector: 'app-pipeline-board',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="shell">

      <!-- ── HEADER ──────────────────────────── -->
      <header class="board-header">
        <div class="header-left">
          <h1 class="board-title">Pipeline</h1>
          <div class="board-stats" aria-live="polite">
            <span class="stat">
              <span class="stat-val">{{ sortedStages().length }}</span>
              <span class="stat-lbl">stages</span>
            </span>
            <span class="stat-sep" aria-hidden="true">·</span>
            <span class="stat">
              <span class="stat-val">{{ totalDeals() }}</span>
              <span class="stat-lbl">deals</span>
            </span>
            <span class="stat-sep" aria-hidden="true">·</span>
            <span class="stat">
              <span class="stat-val">{{ totalValue() | number:'1.0-0' }}</span>
              <span class="stat-lbl">total value</span>
            </span>
          </div>
        </div>
        <button class="btn-primary" (click)="openAddStage()"
          [attr.aria-expanded]="showAddStage()" aria-controls="add-stage-form"
          style="touch-action:manipulation">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Add Stage
        </button>
      </header>

      <!-- ── ERROR ───────────────────────────── -->
      @if (error()) {
        <div class="error-bar" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ error() }}
          <button class="retry-btn" (click)="reload()">Retry</button>
        </div>
      }

      <!-- ── BOARD ───────────────────────────── -->
      <div class="board" role="region" aria-label="Pipeline board">

        <!-- Loading skeleton -->
        @if (loading()) {
          @for (col of [1,2,3,4]; track col) {
            <div class="column" aria-hidden="true">
              <div class="col-header skel-bar"></div>
              @for (card of [1,2,3]; track card) {
                <div class="deal-card skel-card"></div>
              }
            </div>
          }
        }

        <!-- Columns -->
        @if (!loading()) {
          @for (stage of sortedStages(); track stage.id; let si = $index) {
            <div class="column" role="group" [attr.aria-label]="stage.name + ' stage'">

              <!-- Column header -->
              <div class="col-header" [style.border-top-color]="stageColor(stage, si)">
                <div class="col-title-row">
                  <span class="col-name">{{ stage.name }}</span>
                  <span class="col-count" [attr.aria-label]="dealsForStage(stage.id).length + ' deals'">
                    {{ dealsForStage(stage.id).length }}
                  </span>
                </div>
                <div class="col-total" [attr.aria-label]="'Total value ' + stageTotal(stage.id)">
                  {{ stageTotal(stage.id) | number:'1.0-0' }}
                </div>
              </div>

              <!-- Deal list -->
              <div class="deal-list" role="list"
                [attr.aria-label]="'Deals in ' + stage.name">

                @for (deal of dealsForStage(stage.id); track deal.id) {
                  <div class="deal-card" role="listitem" tabindex="0"
                    [attr.aria-label]="deal.title + ', ' + deal.currency + ' ' + deal.value + ', ' + deal.probability + '% probability'">

                    <div class="deal-top">
                      <p class="deal-title">{{ deal.title }}</p>
                      @if (deal.contact) {
                        <p class="deal-contact">
                          {{ deal.contact.firstName }} {{ deal.contact.lastName ?? '' }}
                        </p>
                      }
                    </div>

                    <div class="deal-bottom">
                      <span class="deal-value">
                        {{ deal.currency }} {{ deal.value | number:'1.0-0' }}
                      </span>
                      <span class="prob-badge" [class]="probClass(deal.probability)">
                        {{ deal.probability }}%
                      </span>
                    </div>

                    <!-- Move buttons (WCAG 2.2 AA drag alternative) -->
                    <div class="deal-actions">
                      <button class="move-btn" (click)="moveDealLeft(deal)"
                        [disabled]="!prevStage(deal.stageId)"
                        [attr.aria-label]="'Move ' + deal.title + ' to previous stage'"
                        style="touch-action:manipulation">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      @if (prevStage(deal.stageId)) {
                        <span class="move-label">{{ prevStage(deal.stageId)!.name }}</span>
                      }
                      <span class="move-spacer"></span>
                      @if (nextStage(deal.stageId)) {
                        <span class="move-label move-label--right">{{ nextStage(deal.stageId)!.name }}</span>
                      }
                      <button class="move-btn" (click)="moveDealRight(deal)"
                        [disabled]="!nextStage(deal.stageId)"
                        [attr.aria-label]="'Move ' + deal.title + ' to next stage'"
                        style="touch-action:manipulation">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>

                  </div>
                }

                <!-- Empty state -->
                @if (dealsForStage(stage.id).length === 0 && activeDealFormStageId() !== stage.id) {
                  <div class="empty-col">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <rect x="4" y="8" width="24" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M10 14h12M10 19h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <p>No deals yet</p>
                  </div>
                }
              </div>

              <!-- Inline add-deal form -->
              @if (activeDealFormStageId() === stage.id) {
                <div class="add-form" role="form" [attr.aria-label]="'Add deal to ' + stage.name">
                  <input
                    [id]="'new-deal-title-' + stage.id"
                    class="form-input"
                    type="text"
                    placeholder="Deal title *"
                    [ngModel]="newDealTitle()"
                    (ngModelChange)="newDealTitle.set($event)"
                    aria-required="true"
                    (keydown.enter)="submitNewDeal(stage.id)"
                    (keydown.escape)="cancelDealForm()"
                  />
                  <input
                    class="form-input"
                    type="number"
                    placeholder="Value (optional)"
                    [ngModel]="newDealValue()"
                    (ngModelChange)="newDealValue.set($event)"
                    min="0"
                    (keydown.escape)="cancelDealForm()"
                  />
                  <div class="form-actions">
                    <button class="btn-confirm" (click)="submitNewDeal(stage.id)"
                      [disabled]="!newDealTitle().trim()"
                      style="touch-action:manipulation">
                      Add deal
                    </button>
                    <button class="btn-cancel" (click)="cancelDealForm()"
                      style="touch-action:manipulation">
                      Cancel
                    </button>
                  </div>
                </div>
              }

              <!-- Add deal trigger -->
              @if (activeDealFormStageId() !== stage.id) {
                <button class="add-deal-btn" (click)="openDealForm(stage.id)"
                  [attr.aria-label]="'Add deal to ' + stage.name"
                  style="touch-action:manipulation">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Add deal
                </button>
              }

            </div>
          }

          <!-- Add Stage column -->
          <div class="column column--ghost">
            @if (!showAddStage()) {
              <button class="add-stage-ghost" id="add-stage-form" (click)="openAddStage()"
                aria-label="Add a new pipeline stage"
                style="touch-action:manipulation">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Add Stage</span>
              </button>
            }
            @if (showAddStage()) {
              <div class="add-form" id="add-stage-form" role="form" aria-label="New stage form">
                <p class="form-label">New stage</p>
                <input
                  id="new-stage-name"
                  class="form-input"
                  type="text"
                  placeholder="Stage name *"
                  [ngModel]="newStageName()"
                  (ngModelChange)="newStageName.set($event)"
                  aria-required="true"
                  (keydown.enter)="submitNewStage()"
                  (keydown.escape)="cancelAddStage()"
                />
                <div class="form-actions">
                  <button class="btn-confirm" (click)="submitNewStage()"
                    [disabled]="!newStageName().trim()"
                    style="touch-action:manipulation">
                    Create stage
                  </button>
                  <button class="btn-cancel" (click)="cancelAddStage()"
                    style="touch-action:manipulation">
                    Cancel
                  </button>
                </div>
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host {
      --riverbed:   #231A33;
      --shallows:   #F1EEF8;
      --stream-ink: #8A76E8;
      --current:    #FF6B2C;
      --ready:      #22A565;
      --muted:      #5E566E;
      --border:     rgba(35,26,51,0.1);
      --card-bg:    #fff;
      --col-bg:     rgba(35,26,51,0.03);
      --radius:     10px;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    /* ── SHELL ──────────────────────────────── */
    .shell {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      padding: 24px 24px 0;
      box-sizing: border-box;
    }

    /* ── HEADER ─────────────────────────────── */
    .board-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-shrink: 0;
    }
    .header-left { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
    .board-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .board-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Manrope', sans-serif;
    }
    .stat { display: flex; align-items: baseline; gap: 4px; }
    .stat-val { font-size: 0.9rem; font-weight: 700; color: var(--riverbed); }
    .stat-lbl { font-size: 0.78rem; color: var(--muted); }
    .stat-sep { color: var(--border); font-size: 1rem; }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 38px;
      padding: 0 16px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, transform 0.12s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .btn-primary:hover { background: #7460d4; transform: translateY(-1px); }
    .btn-primary:active { transform: translateY(0); }
    .btn-primary:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 2px;
      border-radius: 8px;
    }

    /* ── ERROR BAR ──────────────────────────── */
    .error-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius);
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      margin-bottom: 16px;
      flex-shrink: 0;
    }
    .retry-btn {
      margin-left: auto;
      background: none;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 3px 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: #b91c1c;
      cursor: pointer;
    }
    .retry-btn:hover { background: #fee2e2; }

    /* ── BOARD ──────────────────────────────── */
    .board {
      flex: 1;
      min-height: 0;
      display: flex;
      gap: 14px;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 24px;
      align-items: flex-start;
      scrollbar-width: thin;
      scrollbar-color: rgba(138,118,232,0.2) transparent;
    }

    /* ── COLUMN ─────────────────────────────── */
    .column {
      min-width: 272px;
      max-width: 272px;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--col-bg);
      border-radius: 14px;
      padding: 12px;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .column--ghost {
      background: transparent;
      border: 2px dashed var(--border);
    }

    /* ── COL HEADER ─────────────────────────── */
    .col-header {
      border-top: 3px solid var(--stream-ink);
      border-radius: 4px 4px 0 0;
      padding: 10px 2px 10px;
      margin-bottom: 10px;
      flex-shrink: 0;
    }
    .col-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .col-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--riverbed);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .col-count {
      background: rgba(35,26,51,0.1);
      color: var(--muted);
      border-radius: 20px;
      padding: 2px 8px;
      font-size: 0.72rem;
      font-family: 'Manrope', sans-serif;
      font-weight: 700;
      flex-shrink: 0;
    }
    .col-total {
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      color: var(--muted);
    }

    /* ── DEAL LIST ──────────────────────────── */
    .deal-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      scrollbar-width: thin;
      scrollbar-color: rgba(138,118,232,0.15) transparent;
    }

    /* ── EMPTY STATE ────────────────────────── */
    .empty-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px 12px;
      color: rgba(94,86,110,0.4);
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      text-align: center;
    }
    .empty-col p { margin: 0; }

    /* ── DEAL CARD ──────────────────────────── */
    .deal-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px;
      cursor: default;
      transition: box-shadow 0.18s, transform 0.12s;
      outline: none;
    }
    .deal-card:hover {
      box-shadow: 0 4px 16px rgba(35,26,51,0.1);
      transform: translateY(-1px);
    }
    .deal-card:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 1px;
      box-shadow: 0 4px 16px rgba(35,26,51,0.1);
    }
    .deal-top { margin-bottom: 8px; }
    .deal-title {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--riverbed);
      margin: 0 0 3px;
      overflow-wrap: anywhere;
    }
    .deal-contact {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      color: var(--muted);
      margin: 0;
    }
    .deal-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }
    .deal-value {
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--ready);
    }

    /* ── PROBABILITY BADGE ──────────────────── */
    .prob-badge {
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      border-radius: 20px;
      padding: 2px 8px;
      flex-shrink: 0;
    }
    .prob--cold  { background: rgba(239,68,68,0.1);  color: #b91c1c; }
    .prob--low   { background: rgba(249,115,22,0.1); color: #c2410c; }
    .prob--mid   { background: rgba(234,179,8,0.1);  color: #a16207; }
    .prob--high  { background: rgba(34,165,101,0.1); color: #166534; }

    /* ── MOVE BUTTONS ───────────────────────── */
    .deal-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }
    .move-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: none;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .move-btn:hover:not(:disabled) {
      background: rgba(138,118,232,0.1);
      color: var(--stream-ink);
      border-color: rgba(138,118,232,0.3);
    }
    .move-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .move-btn:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 1px;
      border-radius: 6px;
    }
    .move-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.68rem;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 60px;
    }
    .move-label--right { text-align: right; }
    .move-spacer { flex: 1; }

    /* ── ADD DEAL BUTTON ────────────────────── */
    .add-deal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      height: 34px;
      margin-top: 8px;
      background: none;
      border: 1px dashed rgba(138,118,232,0.3);
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(138,118,232,0.7);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .add-deal-btn:hover {
      background: rgba(138,118,232,0.06);
      border-color: var(--stream-ink);
      color: var(--stream-ink);
    }
    .add-deal-btn:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 1px;
      border-radius: 8px;
    }

    /* ── ADD STAGE GHOST ────────────────────── */
    .add-stage-ghost {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 100%;
      min-height: 120px;
      background: none;
      border: none;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: rgba(94,86,110,0.5);
      cursor: pointer;
      transition: color 0.15s;
      border-radius: 12px;
    }
    .add-stage-ghost:hover { color: var(--stream-ink); }
    .add-stage-ghost:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 2px;
      border-radius: 12px;
    }

    /* ── INLINE FORM ────────────────────────── */
    .add-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      background: var(--card-bg);
      border: 1px solid rgba(138,118,232,0.3);
      border-radius: var(--radius);
      margin-top: 8px;
      flex-shrink: 0;
    }
    .form-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 4px;
    }
    .form-input {
      height: 36px;
      padding: 0 10px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--riverbed);
      background: var(--shallows);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      width: 100%;
      box-sizing: border-box;
    }
    .form-input::placeholder { color: rgba(94,86,110,0.45); }
    .form-input:focus {
      border-color: var(--stream-ink);
      box-shadow: 0 0 0 3px rgba(138,118,232,0.12);
      background: #fff;
    }
    .form-actions {
      display: flex;
      gap: 6px;
    }
    .btn-confirm {
      flex: 1;
      height: 32px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: 7px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-confirm:hover:not(:disabled) { background: #7460d4; }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-confirm:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 7px; }
    .btn-cancel {
      height: 32px;
      padding: 0 12px;
      background: none;
      border: 1px solid var(--border);
      border-radius: 7px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-cancel:hover { background: rgba(35,26,51,0.05); }
    .btn-cancel:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 7px; }

    /* ── SKELETON ───────────────────────────── */
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .skel-bar, .skel-card {
      border-radius: 8px;
      background: linear-gradient(90deg, rgba(35,26,51,0.06) 25%, rgba(35,26,51,0.12) 50%, rgba(35,26,51,0.06) 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .skel-bar { height: 52px; margin-bottom: 10px; }
    .skel-card { height: 80px; margin-bottom: 8px; }

    @media (prefers-reduced-motion: reduce) {
      .skel-bar, .skel-card { animation: none; }
      .deal-card, .btn-primary, .add-deal-btn { transition: none; }
    }
  `],
})
export class PipelineBoardComponent implements OnInit {
  private svc = inject(PipelineService);

  stages = signal<PipelineStage[]>([]);
  deals  = signal<Deal[]>([]);
  loading = signal(true);
  error   = signal('');

  // Add-deal inline form state
  activeDealFormStageId = signal<string | null>(null);
  newDealTitle = signal('');
  newDealValue = signal('');

  // Add-stage inline form state
  showAddStage = signal(false);
  newStageName = signal('');

  sortedStages = computed(() => [...this.stages()].sort((a, b) => a.position - b.position));
  totalDeals   = computed(() => this.deals().length);
  totalValue   = computed(() => this.deals().reduce((sum, d) => sum + (d.value || 0), 0));

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getStages().subscribe({
      next: (res) => this.stages.set(res.data as PipelineStage[]),
      error: () => { this.error.set('Failed to load stages'); this.loading.set(false); },
    });
    this.svc.getDeals().subscribe({
      next: (res) => { this.deals.set(res.data.data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load deals'); this.loading.set(false); },
    });
  }

  dealsForStage(stageId: string): Deal[] {
    return this.deals().filter(d => d.stageId === stageId);
  }

  stageTotal(stageId: string): number {
    return this.dealsForStage(stageId).reduce((s, d) => s + (d.value || 0), 0);
  }

  stageColor(stage: PipelineStage, index: number): string {
    return stage.color || STAGE_COLORS[index % STAGE_COLORS.length];
  }

  prevStage(stageId: string): PipelineStage | null {
    const idx = this.sortedStages().findIndex(s => s.id === stageId);
    return idx > 0 ? this.sortedStages()[idx - 1] : null;
  }

  nextStage(stageId: string): PipelineStage | null {
    const stages = this.sortedStages();
    const idx = stages.findIndex(s => s.id === stageId);
    return idx < stages.length - 1 ? stages[idx + 1] : null;
  }

  probClass(prob: number): string {
    if (prob >= 75) return 'prob-badge prob--high';
    if (prob >= 50) return 'prob-badge prob--mid';
    if (prob >= 25) return 'prob-badge prob--low';
    return 'prob-badge prob--cold';
  }

  // ── Deal form ──────────────────────────────
  openDealForm(stageId: string) {
    this.activeDealFormStageId.set(stageId);
    this.newDealTitle.set('');
    this.newDealValue.set('');
    setTimeout(() => {
      (document.getElementById('new-deal-title-' + stageId) as HTMLElement)?.focus();
    }, 0);
  }

  cancelDealForm() {
    this.activeDealFormStageId.set(null);
    this.newDealTitle.set('');
    this.newDealValue.set('');
  }

  submitNewDeal(stageId: string) {
    const title = this.newDealTitle().trim();
    if (!title) return;
    const val = parseFloat(this.newDealValue());
    const dto: Partial<Deal> = {
      title,
      stageId,
      position: this.dealsForStage(stageId).length,
      ...(isNaN(val) ? {} : { value: val }),
    };
    this.svc.createDeal(dto).subscribe({
      next: (res) => {
        this.deals.update(ds => [...ds, res.data as Deal]);
        this.cancelDealForm();
      },
    });
  }

  // ── Stage form ─────────────────────────────
  openAddStage() {
    this.showAddStage.set(true);
    setTimeout(() => (document.getElementById('new-stage-name') as HTMLElement)?.focus(), 0);
  }

  cancelAddStage() {
    this.showAddStage.set(false);
    this.newStageName.set('');
  }

  submitNewStage() {
    const name = this.newStageName().trim();
    if (!name) return;
    this.svc.createStage({ name, position: this.stages().length }).subscribe({
      next: (res) => {
        this.stages.update(s => [...s, res.data as PipelineStage]);
        this.cancelAddStage();
      },
    });
  }

  // ── Move deal ──────────────────────────────
  moveDealLeft(deal: Deal) {
    const prev = this.prevStage(deal.stageId);
    if (!prev) return;
    this.svc.moveDeal(deal.id, prev.id, this.dealsForStage(prev.id).length).subscribe({
      next: () => this.deals.update(ds => ds.map(d => d.id === deal.id ? { ...d, stageId: prev.id } : d)),
    });
  }

  moveDealRight(deal: Deal) {
    const next = this.nextStage(deal.stageId);
    if (!next) return;
    this.svc.moveDeal(deal.id, next.id, this.dealsForStage(next.id).length).subscribe({
      next: () => this.deals.update(ds => ds.map(d => d.id === deal.id ? { ...d, stageId: next.id } : d)),
    });
  }
}
