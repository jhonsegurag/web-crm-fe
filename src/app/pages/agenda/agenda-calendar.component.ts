import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AgendaService } from './agenda.service';
import { Appointment } from '../../shared/types';

const STATUS_CFG: Record<Appointment['status'], { label: string; color: string; bg: string; border: string }> = {
  scheduled:   { label: 'Scheduled',   color: '#5b21b6', bg: '#ede9fe', border: '#8A76E8' },
  confirmed:   { label: 'Confirmed',   color: '#166534', bg: '#dcfce7', border: '#22A565' },
  in_progress: { label: 'In Progress', color: '#92400e', bg: '#fef3c7', border: '#f59e0b' },
  completed:   { label: 'Completed',   color: '#1e40af', bg: '#dbeafe', border: '#60a5fa' },
  cancelled:   { label: 'Cancelled',   color: '#991b1b', bg: '#fee2e2', border: '#ef4444' },
  no_show:     { label: 'No Show',     color: '#374151', bg: '#f3f4f6', border: '#94a3b8' },
};

const REMINDER_OPTS = [
  { value: '0',   label: 'No reminder' },
  { value: '5',   label: '5 min before' },
  { value: '10',  label: '10 min before' },
  { value: '15',  label: '15 min before' },
  { value: '30',  label: '30 min before' },
  { value: '60',  label: '1 hour before' },
  { value: '120', label: '2 hours before' },
];

@Component({
  selector: 'app-agenda-calendar',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">

      <!-- ── TOPBAR ──────────────────────────────────── -->
      <div class="topbar">
        <div class="topbar-start">
          <h1 class="page-title">Agenda</h1>
          <div class="week-nav" role="navigation" aria-label="Week navigation">
            <button class="nav-btn" (click)="prevWeek()" aria-label="Previous week" style="touch-action:manipulation">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="week-label" aria-live="polite" aria-atomic="true">{{ weekLabel() }}</span>
            <button class="nav-btn" (click)="nextWeek()" aria-label="Next week" style="touch-action:manipulation">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="today-btn" (click)="goToday()" style="touch-action:manipulation">Today</button>
          </div>
        </div>

        <div class="topbar-end">
          <div class="view-toggle" role="group" aria-label="Calendar view">
            <button class="vt-btn" [class.vt-btn--active]="view() === 'week'" (click)="setView('week')" style="touch-action:manipulation">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                <rect x="5.25" y="1" width="3.5" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                <rect x="9.5" y="1" width="3.5" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                <rect x="1" y="5.25" width="3.5" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                <rect x="5.25" y="5.25" width="3.5" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                <rect x="9.5" y="5.25" width="3.5" height="3.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              Week
            </button>
            <button class="vt-btn" [class.vt-btn--active]="view() === 'list'" (click)="setView('list')" style="touch-action:manipulation">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 3.5h12M1 7h12M1 10.5h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              List
            </button>
          </div>
          <button class="btn-primary" (click)="openForm()" [disabled]="showForm()" style="touch-action:manipulation">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 1.5v12M1.5 7.5h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            New Appointment
          </button>
        </div>
      </div>

      <!-- ── INLINE FORM ─────────────────────────────── -->
      @if (showForm()) {
        <div class="form-panel" role="dialog" aria-label="Appointment form" aria-modal="false">
          <div class="form-panel-header">
            <h2 class="form-title">{{ editingId() ? 'Edit Appointment' : 'New Appointment' }}</h2>
            <button class="close-btn" (click)="cancelForm()" aria-label="Close form" style="touch-action:manipulation">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          @if (saveError()) {
            <div class="save-error" role="alert">{{ saveError() }}</div>
          }

          <div class="form-grid">

            <!-- Title -->
            <div class="field field--span2">
              <label class="label" for="f-title">Title <span class="req" aria-hidden="true">*</span></label>
              <input id="f-title" class="input" [class.input--error]="fTouched() && !fTitle().trim()"
                type="text" placeholder="e.g. Meeting with client"
                [value]="fTitle()" (input)="fTitle.set(getInputValue($event))"
                [attr.aria-describedby]="fTouched() && !fTitle().trim() ? 'f-title-err' : null"
                autocomplete="off" />
              @if (fTouched() && !fTitle().trim()) {
                <span class="field-error" id="f-title-err" role="alert">Title is required</span>
              }
            </div>

            <!-- Starts At -->
            <div class="field">
              <label class="label" for="f-starts">Starts at <span class="req" aria-hidden="true">*</span></label>
              <input id="f-starts" class="input" [class.input--error]="fTouched() && !fStartsAt()"
                type="datetime-local"
                [value]="fStartsAt()" (change)="fStartsAt.set(getInputValue($event))"
                [attr.aria-describedby]="fTouched() && !fStartsAt() ? 'f-starts-err' : null" />
              @if (fTouched() && !fStartsAt()) {
                <span class="field-error" id="f-starts-err" role="alert">Start time is required</span>
              }
            </div>

            <!-- Ends At -->
            <div class="field">
              <label class="label" for="f-ends">Ends at <span class="req" aria-hidden="true">*</span></label>
              <input id="f-ends" class="input" [class.input--error]="fTouched() && !fEndsAt()"
                type="datetime-local"
                [value]="fEndsAt()" (change)="fEndsAt.set(getInputValue($event))"
                [attr.aria-describedby]="fTouched() && !fEndsAt() ? 'f-ends-err' : null" />
              @if (fTouched() && !fEndsAt()) {
                <span class="field-error" id="f-ends-err" role="alert">End time is required</span>
              }
            </div>

            <!-- Status -->
            <div class="field">
              <label class="label" for="f-status">Status</label>
              <select id="f-status" class="input" (change)="setFStatus($event)">
                <option value="scheduled"   [selected]="fStatus() === 'scheduled'">Scheduled</option>
                <option value="confirmed"   [selected]="fStatus() === 'confirmed'">Confirmed</option>
                <option value="in_progress" [selected]="fStatus() === 'in_progress'">In Progress</option>
                <option value="completed"   [selected]="fStatus() === 'completed'">Completed</option>
                <option value="cancelled"   [selected]="fStatus() === 'cancelled'">Cancelled</option>
                <option value="no_show"     [selected]="fStatus() === 'no_show'">No Show</option>
              </select>
            </div>

            <!-- Reminder -->
            <div class="field">
              <label class="label" for="f-reminder">Reminder</label>
              <select id="f-reminder" class="input" (change)="fReminder.set(getInputValue($event))">
                @for (opt of reminderOpts; track opt.value) {
                  <option [value]="opt.value" [selected]="fReminder() === opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <!-- Location -->
            <div class="field">
              <label class="label" for="f-location">Location</label>
              <input id="f-location" class="input" type="text" placeholder="e.g. Meeting room A"
                [value]="fLocation()" (input)="fLocation.set(getInputValue($event))"
                autocomplete="off" />
            </div>

            <!-- Assigned To -->
            <div class="field">
              <label class="label" for="f-assigned">Assigned to</label>
              <input id="f-assigned" class="input" type="text" placeholder="User ID or name"
                [value]="fAssignedTo()" (input)="fAssignedTo.set(getInputValue($event))"
                autocomplete="off" />
            </div>

            <!-- Description -->
            <div class="field field--span2">
              <label class="label" for="f-desc">Description</label>
              <textarea id="f-desc" class="input input--textarea" rows="3"
                placeholder="Add notes or details…"
                [value]="fDesc()" (input)="fDesc.set(getInputValue($event))"></textarea>
            </div>

          </div>

          <div class="form-actions">
            <button class="btn-ghost" (click)="cancelForm()" [disabled]="saving()" style="touch-action:manipulation">Cancel</button>
            @if (editingId()) {
              <button class="btn-danger-ghost" (click)="confirmDelete(editingId()!)" [disabled]="saving()" style="touch-action:manipulation">Delete</button>
            }
            <button class="btn-primary form-save-btn" (click)="saveAppointment()" [disabled]="saving()" [attr.aria-busy]="saving()" style="touch-action:manipulation">
              @if (saving()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Saving…</span>
              } @else {
                <span>{{ editingId() ? 'Save changes' : 'Create appointment' }}</span>
              }
            </button>
          </div>

          @if (confirmDeleteId()) {
            <div class="delete-confirm" role="alert">
              <span>Delete this appointment?</span>
              <button class="btn-danger" (click)="deleteAppointment(confirmDeleteId()!)" style="touch-action:manipulation">Yes, delete</button>
              <button class="btn-ghost-sm" (click)="cancelDelete()" style="touch-action:manipulation">Cancel</button>
            </div>
          }
        </div>
      }

      <!-- ── LOADING SKELETON ─────────────────────────── -->
      @if (loading()) {
        <div class="skeleton-wrap" aria-busy="true" aria-label="Loading appointments">
          @for (_ of skeletons; track $index) {
            <div class="skeleton-card">
              <div class="skel skel--title"></div>
              <div class="skel skel--meta"></div>
            </div>
          }
        </div>
      }

      <!-- ── ERROR BAR ────────────────────────────────── -->
      @if (!loading() && error()) {
        <div class="error-bar" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ error() }}
          <button class="retry-btn" (click)="loadWeek()" style="touch-action:manipulation">Retry</button>
        </div>
      }

      <!-- ── WEEK VIEW ─────────────────────────────────── -->
      @if (!loading() && !error() && view() === 'week') {
        <div class="week-wrap">
          <div class="week-grid" role="grid" [attr.aria-label]="'Week of ' + weekLabel()">
            @for (day of weekDays(); track day.getTime()) {
              <div class="day-col" [class.day-col--today]="isToday(day)"
                role="gridcell" [attr.aria-label]="day | date:'EEEE, MMMM d'">
                <div class="day-header">
                  <span class="day-name">{{ day | date:'EEE' }}</span>
                  <span class="day-num" [class.day-num--today]="isToday(day)">{{ day | date:'d' }}</span>
                </div>
                <div class="day-body">
                  @for (apt of aptsForDay(day); track apt.id) {
                    <button class="apt-card"
                      [style.border-left-color]="statusCfg(apt.status).border"
                      [style.background]="statusCfg(apt.status).bg"
                      (click)="openForm(apt)"
                      [attr.aria-label]="apt.title + ', ' + statusCfg(apt.status).label + ', ' + (apt.startsAt | date:'shortTime')"
                      style="touch-action:manipulation">
                      <span class="apt-time" [style.color]="statusCfg(apt.status).color">{{ apt.startsAt | date:'shortTime' }}</span>
                      <span class="apt-title-wk">{{ apt.title }}</span>
                      @if (apt.locationText) {
                        <span class="apt-loc-wk">{{ apt.locationText }}</span>
                      }
                    </button>
                  } @empty {
                    <div class="day-empty" aria-hidden="true">No events</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── LIST VIEW ─────────────────────────────────── -->
      @if (!loading() && !error() && view() === 'list') {
        <div class="list-wrap">
          @if (appointments().length === 0) {
            <div class="empty-state" role="status">
              <div class="empty-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect x="5" y="9" width="30" height="26" rx="4" stroke="#B8A7FF" stroke-width="2"/>
                  <path d="M5 17h30" stroke="#B8A7FF" stroke-width="2"/>
                  <path d="M13 5v8M27 5v8" stroke="#B8A7FF" stroke-width="2" stroke-linecap="round"/>
                  <path d="M13 24h14M13 30h8" stroke="#B8A7FF" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <p class="empty-title">No appointments this week</p>
              <p class="empty-sub">Use "New Appointment" to schedule one.</p>
            </div>
          } @else {
            @for (group of groupedApts(); track group.label) {
              <div class="apt-group">
                <h2 class="group-label">{{ group.label }}</h2>
                @for (apt of group.apts; track apt.id) {
                  <div class="list-apt" [style.border-left-color]="statusCfg(apt.status).border">
                    <div class="list-apt-body">
                      <div class="list-apt-top">
                        <span class="list-apt-title">{{ apt.title }}</span>
                        <span class="badge"
                          [style.color]="statusCfg(apt.status).color"
                          [style.background]="statusCfg(apt.status).bg">
                          {{ statusCfg(apt.status).label }}
                        </span>
                      </div>
                      <div class="list-apt-meta">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style="flex-shrink:0">
                          <circle cx="6.5" cy="6.5" r="5.75" stroke="currentColor" stroke-width="1.3"/>
                          <path d="M6.5 3.5v3l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                        </svg>
                        {{ apt.startsAt | date:'shortTime' }} – {{ apt.endsAt | date:'shortTime' }}
                        @if (apt.locationText) {
                          <span class="meta-sep" aria-hidden="true">·</span>
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style="flex-shrink:0">
                            <path d="M6.5 1.5C4.567 1.5 3 3.067 3 5c0 2.5 3.5 6.5 3.5 6.5S10 7.5 10 5c0-1.933-1.567-3.5-3.5-3.5z" stroke="currentColor" stroke-width="1.3"/>
                            <circle cx="6.5" cy="5" r="1.25" stroke="currentColor" stroke-width="1.3"/>
                          </svg>
                          {{ apt.locationText }}
                        }
                      </div>
                      @if (apt.description) {
                        <p class="list-apt-desc">{{ apt.description }}</p>
                      }
                    </div>
                    <div class="list-apt-actions">
                      <button class="action-btn" (click)="openForm(apt)"
                        [attr.aria-label]="'Edit ' + apt.title"
                        style="touch-action:manipulation">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                          <path d="M10.5 2.5l2 2L5 12H3v-2l7.5-7.5z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      @if (confirmDeleteId() === apt.id) {
                        <div class="inline-confirm">
                          <span>Delete?</span>
                          <button class="btn-danger-xs" (click)="deleteAppointment(apt.id)" style="touch-action:manipulation">Yes</button>
                          <button class="btn-ghost-xs" (click)="cancelDelete()" style="touch-action:manipulation">No</button>
                        </div>
                      } @else {
                        <button class="action-btn action-btn--del" (click)="confirmDelete(apt.id)"
                          [attr.aria-label]="'Delete ' + apt.title"
                          style="touch-action:manipulation">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                            <path d="M2.5 4h10M5 4V2.5h5V4M6 7v4M9 7v4M3.5 4l1 8.5h7l1-8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
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
      --border:     rgba(35,26,51,0.12);
      --radius:     12px;
      --shadow-sm:  0 1px 3px rgba(35,26,51,0.07), 0 1px 2px rgba(35,26,51,0.04);
      --shadow-md:  0 4px 16px rgba(35,26,51,0.08), 0 2px 6px rgba(35,26,51,0.04);
    }

    /* ── PAGE ──────────────────────────────── */
    .page {
      padding: 24px;
      background: var(--shallows);
      min-height: 100%;
      box-sizing: border-box;
    }
    @media (max-width: 768px) { .page { padding: 16px; } }

    /* ── TOPBAR ────────────────────────────── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .topbar-start {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .topbar-end {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .page-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }

    /* ── WEEK NAV ──────────────────────────── */
    .week-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      padding: 4px 6px;
    }
    .nav-btn {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: 6px;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .nav-btn:hover { background: var(--shallows); color: var(--riverbed); }
    .nav-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }
    .week-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--riverbed);
      min-width: 172px;
      text-align: center;
      white-space: nowrap;
    }
    .today-btn {
      height: 30px;
      padding: 0 10px;
      background: none;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--stream-ink);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .today-btn:hover { background: #f0ebff; border-color: var(--stream-ink); }
    .today-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }

    /* ── VIEW TOGGLE ───────────────────────── */
    .view-toggle {
      display: flex;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      padding: 3px;
      gap: 2px;
    }
    .vt-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 32px;
      padding: 0 12px;
      background: none;
      border: none;
      border-radius: 7px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .vt-btn--active { background: var(--riverbed); color: #fff; }
    .vt-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 7px; }

    /* ── PRIMARY BUTTON ────────────────────── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
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
      white-space: nowrap;
      transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
      box-shadow: 0 2px 8px rgba(138,118,232,0.3);
    }
    .btn-primary:hover:not(:disabled) { background: #7460d4; box-shadow: 0 4px 14px rgba(138,118,232,0.4); transform: translateY(-1px); }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }
    .btn-primary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 10px; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-ghost {
      height: 38px;
      padding: 0 16px;
      background: none;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-ghost:hover { background: rgba(35,26,51,0.04); border-color: rgba(35,26,51,0.25); }
    .btn-ghost:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 10px; }
    .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-ghost-sm {
      height: 32px;
      padding: 0 12px;
      background: none;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-ghost-sm:hover { background: rgba(35,26,51,0.04); }
    .btn-ghost-sm:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 8px; }

    .btn-danger-ghost {
      height: 38px;
      padding: 0 16px;
      background: none;
      border: 1.5px solid #fecaca;
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: #ef4444;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-danger-ghost:hover { background: #fef2f2; }
    .btn-danger-ghost:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 10px; }
    .btn-danger-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-danger {
      height: 34px;
      padding: 0 14px;
      background: #ef4444;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-danger:hover { background: #dc2626; }
    .btn-danger:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 8px; }

    /* ── FORM PANEL ────────────────────────── */
    .form-panel {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-md);
      animation: panelIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes panelIn {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .form-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .form-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .close-btn {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: 8px;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: #f3f4f6; color: var(--riverbed); }
    .close-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 8px; }

    .save-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      padding: 10px 14px;
      margin-bottom: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .field--span2 { grid-column: span 2; }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .field--span2 { grid-column: span 1; }
    }

    /* ── FIELD ─────────────────────────────── */
    .field { display: flex; flex-direction: column; }
    .label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--riverbed);
      margin-bottom: 5px;
    }
    .req { color: var(--current); margin-left: 2px; }
    .input {
      height: 42px;
      padding: 0 12px;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      color: var(--riverbed);
      background: #fff;
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
      box-sizing: border-box;
      width: 100%;
    }
    .input::placeholder { color: rgba(94,86,110,0.5); }
    .input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 3px rgba(138,118,232,0.12); }
    .input:hover:not(:focus) { border-color: rgba(138,118,232,0.35); }
    .input--error { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.08) !important; }
    .input--textarea { height: auto; padding: 10px 12px; resize: vertical; line-height: 1.5; }
    select.input { cursor: pointer; }
    .field-error {
      margin-top: 4px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      color: #ef4444;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .form-save-btn { margin-left: auto; }
    @media (max-width: 480px) {
      .form-save-btn { margin-left: 0; width: 100%; justify-content: center; }
    }

    .delete-confirm {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      padding: 12px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: #991b1b;
    }

    /* ── LOADING SKELETON ──────────────────── */
    .skeleton-wrap { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-card {
      background: #fff;
      border-radius: var(--radius);
      padding: 18px;
      border: 1.5px solid var(--border);
    }
    .skel {
      background: linear-gradient(90deg, #f0ebff 0%, #e4ddf8 50%, #f0ebff 100%);
      background-size: 200% 100%;
      border-radius: 6px;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .skel--title { height: 18px; width: 60%; margin-bottom: 10px; }
    .skel--meta  { height: 14px; width: 40%; }

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
      margin-bottom: 16px;
    }
    .retry-btn {
      margin-left: auto;
      height: 30px;
      padding: 0 12px;
      background: none;
      border: 1.5px solid #fca5a5;
      border-radius: 7px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: #ef4444;
      cursor: pointer;
      transition: background 0.15s;
    }
    .retry-btn:hover { background: #fee2e2; }
    .retry-btn:focus-visible { outline: 2px solid #ef4444; outline-offset: 2px; border-radius: 7px; }

    /* ── WEEK GRID ─────────────────────────── */
    .week-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(140px, 1fr));
      gap: 8px;
      min-width: 720px;
    }
    .day-col {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      min-height: 260px;
      overflow: hidden;
    }
    .day-col--today { border-color: var(--stream-ink); }
    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px 8px;
      border-bottom: 1px solid var(--border);
    }
    .day-col--today .day-header { background: #f5f3ff; }
    .day-name {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .day-num {
      font-family: 'DM Mono', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--riverbed);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .day-num--today { background: var(--stream-ink); color: #fff; }
    .day-body {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .apt-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 7px 10px;
      border: none;
      border-left: 3px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: opacity 0.15s, transform 0.1s;
    }
    .apt-card:hover { opacity: 0.82; transform: scale(1.015); }
    .apt-card:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 8px; }
    .apt-time {
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .apt-title-wk {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--riverbed);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .apt-loc-wk {
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .day-empty {
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      color: rgba(94,86,110,0.35);
      text-align: center;
      padding: 20px 0;
    }

    /* ── LIST VIEW ─────────────────────────── */
    .list-wrap { display: flex; flex-direction: column; gap: 24px; }
    .apt-group { display: flex; flex-direction: column; gap: 8px; }
    .group-label {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin: 0 0 4px;
    }
    .list-apt {
      background: #fff;
      border: 1.5px solid var(--border);
      border-left: 3px solid transparent;
      border-radius: var(--radius);
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      transition: box-shadow 0.15s;
    }
    .list-apt:hover { box-shadow: var(--shadow-sm); }
    .list-apt-body { flex: 1; min-width: 0; }
    .list-apt-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .list-apt-title {
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--riverbed);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: 100px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .list-apt-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      color: var(--muted);
      flex-wrap: wrap;
    }
    .meta-sep { color: rgba(35,26,51,0.2); margin: 0 1px; }
    .list-apt-desc {
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      margin: 6px 0 0;
      line-height: 1.5;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .list-apt-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .action-btn {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1.5px solid transparent;
      border-radius: 8px;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .action-btn:hover { background: #f3f4f6; color: var(--riverbed); border-color: var(--border); }
    .action-btn--del:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
    .action-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 8px; }

    .inline-confirm {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      color: #991b1b;
      white-space: nowrap;
    }
    .btn-danger-xs {
      height: 26px;
      padding: 0 10px;
      background: #ef4444;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-danger-xs:hover { background: #dc2626; }
    .btn-danger-xs:focus-visible { outline: 2px solid #ef4444; outline-offset: 1px; border-radius: 6px; }
    .btn-ghost-xs {
      height: 26px;
      padding: 0 10px;
      background: none;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-ghost-xs:hover { background: #f3f4f6; }
    .btn-ghost-xs:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 6px; }

    /* ── EMPTY STATE ───────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }
    .empty-icon {
      width: 80px;
      height: 80px;
      background: #f0ebff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
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
      font-size: 0.9rem;
      color: var(--muted);
      margin: 0;
    }

    /* ── SPINNER ───────────────────────────── */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── REDUCED MOTION ────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .form-panel { animation: none; }
      .spinner     { animation: none; opacity: 0.6; }
      .skel        { animation: none; background: #ede9fe; }
      .apt-card, .list-apt, .btn-primary, .action-btn { transition: none; }
    }
  `],
})
export class AgendaCalendarComponent implements OnInit {
  private svc = inject(AgendaService);

  readonly skeletons = Array(5);
  readonly reminderOpts = REMINDER_OPTS;

  appointments = signal<Appointment[]>([]);
  loading      = signal(false);
  error        = signal('');
  view         = signal<'week' | 'list'>('week');
  weekStart    = signal<Date>(this.getWeekStart(new Date()));

  showForm       = signal(false);
  saving         = signal(false);
  saveError      = signal('');
  editingId      = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);

  // Form fields
  fTitle     = signal('');
  fDesc      = signal('');
  fStartsAt  = signal('');
  fEndsAt    = signal('');
  fLocation  = signal('');
  fStatus    = signal<Appointment['status']>('scheduled');
  fReminder  = signal('15');
  fAssignedTo = signal('');
  fTouched   = signal(false);

  weekDays = computed(() => {
    const start = this.weekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  });

  weekLabel = computed(() => {
    const days = this.weekDays();
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(days[0])} – ${fmt(days[6])}, ${days[6].getFullYear()}`;
  });

  groupedApts = computed(() => {
    const apts = [...this.appointments()].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const groups: { label: string; apts: Appointment[] }[] = [];
    for (const apt of apts) {
      const d = new Date(apt.startsAt); d.setHours(0, 0, 0, 0);
      let label: string;
      if (d.getTime() === today.getTime()) label = 'Today';
      else if (d.getTime() === tomorrow.getTime()) label = 'Tomorrow';
      else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const existing = groups.find(g => g.label === label);
      if (existing) existing.apts.push(apt);
      else groups.push({ label, apts: [apt] });
    }
    return groups;
  });

  ngOnInit() { this.loadWeek(); }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  loadWeek() {
    this.loading.set(true);
    this.error.set('');
    const days = this.weekDays();
    const from = days[0].toISOString();
    const end = new Date(days[6]); end.setHours(23, 59, 59, 999);
    const to = end.toISOString();
    this.svc.list({ from, to }).subscribe({
      next: (res) => { this.appointments.set(res.data.data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load appointments. Please try again.'); this.loading.set(false); },
    });
  }

  prevWeek() {
    this.weekStart.update(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    this.loadWeek();
  }

  nextWeek() {
    this.weekStart.update(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    this.loadWeek();
  }

  goToday() { this.weekStart.set(this.getWeekStart(new Date())); this.loadWeek(); }

  setView(v: 'week' | 'list') { this.view.set(v); }

  isToday(date: Date): boolean {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    return t.getTime() === d.getTime();
  }

  aptsForDay(day: Date): Appointment[] {
    const d = new Date(day); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    return this.appointments()
      .filter(apt => { const t = new Date(apt.startsAt).getTime(); return t >= d.getTime() && t < next.getTime(); })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  statusCfg(status: Appointment['status']) { return STATUS_CFG[status] ?? STATUS_CFG['scheduled']; }

  openForm(apt?: Appointment) {
    if (apt) {
      this.editingId.set(apt.id);
      this.fTitle.set(apt.title);
      this.fDesc.set(apt.description ?? '');
      this.fStartsAt.set(apt.startsAt.slice(0, 16));
      this.fEndsAt.set(apt.endsAt.slice(0, 16));
      this.fLocation.set(apt.locationText ?? '');
      this.fStatus.set(apt.status);
      this.fReminder.set(String(apt.reminderMinutes));
      this.fAssignedTo.set(apt.assignedTo);
    } else {
      this.editingId.set(null);
      this.fTitle.set('');
      this.fDesc.set('');
      this.fStartsAt.set('');
      this.fEndsAt.set('');
      this.fLocation.set('');
      this.fStatus.set('scheduled');
      this.fReminder.set('15');
      this.fAssignedTo.set('');
    }
    this.fTouched.set(false);
    this.saveError.set('');
    this.confirmDeleteId.set(null);
    this.showForm.set(true);
  }

  cancelForm() { this.showForm.set(false); this.editingId.set(null); this.confirmDeleteId.set(null); }

  setFStatus(event: Event) { this.fStatus.set(this.getInputValue(event) as Appointment['status']); }

  saveAppointment() {
    this.fTouched.set(true);
    if (!this.fTitle().trim() || !this.fStartsAt() || !this.fEndsAt()) return;
    const dto: Partial<Appointment> = {
      title:           this.fTitle().trim(),
      description:     this.fDesc().trim() || undefined,
      startsAt:        this.fStartsAt() + ':00.000Z',
      endsAt:          this.fEndsAt() + ':00.000Z',
      locationText:    this.fLocation().trim() || undefined,
      status:          this.fStatus(),
      reminderMinutes: parseInt(this.fReminder(), 10) || 0,
      assignedTo:      this.fAssignedTo().trim(),
    };
    this.saving.set(true);
    this.saveError.set('');
    const id = this.editingId();
    const req$ = id ? this.svc.update(id, dto) : this.svc.create(dto);
    req$.subscribe({
      next: (res) => {
        const apt = res.data as Appointment;
        if (id) this.appointments.update(list => list.map(a => a.id === id ? apt : a));
        else    this.appointments.update(list => [...list, apt]);
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
      },
      error: () => { this.saveError.set('Failed to save. Please try again.'); this.saving.set(false); },
    });
  }

  confirmDelete(id: string) { this.confirmDeleteId.set(id); }
  cancelDelete()             { this.confirmDeleteId.set(null); }

  deleteAppointment(id: string) {
    this.svc.remove(id).subscribe({
      next: () => {
        this.appointments.update(list => list.filter(a => a.id !== id));
        this.confirmDeleteId.set(null);
        if (this.editingId() === id) { this.showForm.set(false); this.editingId.set(null); }
      },
      error: () => { this.confirmDeleteId.set(null); },
    });
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
