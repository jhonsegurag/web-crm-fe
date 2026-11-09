import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AgentService, AgentConfig, AgentLog } from './agent.service';

const LOG_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  success: { label: 'Success', color: '#166534', bg: '#dcfce7' },
  error:   { label: 'Error',   color: '#991b1b', bg: '#fee2e2' },
  failed:  { label: 'Failed',  color: '#991b1b', bg: '#fee2e2' },
  pending: { label: 'Pending', color: '#92400e', bg: '#fef3c7' },
  running: { label: 'Running', color: '#5b21b6', bg: '#ede9fe' },
};

@Component({
  selector: 'app-agent-config',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">

      <!-- ── TOPBAR ──────────────────────────────────── -->
      <div class="topbar">
        <div class="topbar-start">
          <h1 class="page-title">Agent</h1>
          <p class="page-sub">Configure your AI assistant and monitor activity</p>
        </div>
        <div class="topbar-end">
          @if (activeTab() === 'config') {
            @if (saveSuccess()) {
              <span class="save-toast" role="status" aria-live="polite">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="6.25" fill="#22A565"/>
                  <path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Saved!
              </span>
            }
            <button class="btn-primary" (click)="save()" [disabled]="saving() || loadingConfig()"
              [attr.aria-busy]="saving()" style="touch-action:manipulation">
              @if (saving()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Saving…</span>
              } @else {
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="M2 8.5L5.5 12 13 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Save changes
              }
            </button>
          }
          @if (activeTab() === 'logs') {
            <button class="btn-ghost" (click)="loadLogs()" [disabled]="loadingLogs()" style="touch-action:manipulation">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M12 7A5 5 0 1 1 9.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M9.5 1v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Refresh
            </button>
          }
        </div>
      </div>

      <!-- ── TAB STRIP ───────────────────────────────── -->
      <div class="tab-strip" role="tablist" aria-label="Agent sections">
        <button class="tab" [class.tab--active]="activeTab() === 'config'"
          (click)="setTab('config')" role="tab"
          [attr.aria-selected]="activeTab() === 'config'"
          style="touch-action:manipulation">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="2.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.75 2.75l1.06 1.06M10.19 10.19l1.06 1.06M2.75 11.25l1.06-1.06M10.19 3.81l1.06-1.06" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Configuration
        </button>
        <button class="tab" [class.tab--active]="activeTab() === 'logs'"
          (click)="setTab('logs')" role="tab"
          [attr.aria-selected]="activeTab() === 'logs'"
          style="touch-action:manipulation">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Activity Logs
          @if (logs().length > 0) {
            <span class="tab-badge" [attr.aria-label]="logs().length + ' log entries'">{{ logs().length }}</span>
          }
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- CONFIG TAB                                      -->
      <!-- ═══════════════════════════════════════════════ -->
      @if (activeTab() === 'config') {

        <!-- Config loading skeleton -->
        @if (loadingConfig()) {
          <div class="config-card" aria-busy="true" aria-label="Loading configuration">
            @for (_ of skeletons; track $index) {
              <div class="skel-field">
                <div class="skel skel--label"></div>
                <div class="skel skel--input"></div>
              </div>
            }
          </div>
        }

        <!-- Config error -->
        @if (!loadingConfig() && errorConfig()) {
          <div class="error-bar" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ errorConfig() }}
          </div>
        }

        <!-- Config form -->
        @if (!loadingConfig() && !errorConfig()) {
          <div class="config-card">

            @if (saveError()) {
              <div class="form-error" role="alert">{{ saveError() }}</div>
            }

            <!-- ── SECTION: Identity ──────────────── -->
            <div class="section">
              <div class="section-head">
                <p class="section-label">Identity</p>
                <p class="section-hint">Basic information about this agent</p>
              </div>
              <div class="form-grid">

                <!-- Name -->
                <div class="field">
                  <label class="label" for="f-name">Agent Name</label>
                  <input id="f-name" class="input" type="text" placeholder="e.g. Sales Assistant"
                    [value]="fName()" (input)="fName.set(getInputValue($event))"
                    autocomplete="off" />
                </div>

                <!-- Provider -->
                <div class="field">
                  <label class="label" for="f-provider">Provider</label>
                  <select id="f-provider" class="input" (change)="setFProvider($event)">
                    <option value="openai"     [selected]="fProvider() === 'openai'">OpenAI</option>
                    <option value="anthropic"  [selected]="fProvider() === 'anthropic'">Anthropic</option>
                    <option value="groq"       [selected]="fProvider() === 'groq'">Groq</option>
                    <option value="custom"     [selected]="fProvider() === 'custom'">Custom</option>
                  </select>
                </div>

                <!-- Model -->
                <div class="field field--span2">
                  <label class="label" for="f-model">Model</label>
                  <input id="f-model" class="input" type="text"
                    [placeholder]="modelPlaceholder()"
                    [value]="fModel()" (input)="fModel.set(getInputValue($event))"
                    autocomplete="off" />
                  <span class="field-hint">Enter the exact model identifier from your provider</span>
                </div>

              </div>
            </div>

            <div class="divider" role="separator"></div>

            <!-- ── SECTION: Model Settings ───────── -->
            <div class="section">
              <div class="section-head">
                <p class="section-label">Model Settings</p>
                <p class="section-hint">Control how the model generates responses</p>
              </div>

              <!-- System Prompt -->
              <div class="field">
                <div class="label-row">
                  <label class="label" for="f-prompt">System Prompt</label>
                  <span class="char-count" aria-live="polite" aria-atomic="true">{{ promptLength() }} chars</span>
                </div>
                <textarea id="f-prompt" class="input input--textarea" rows="6"
                  placeholder="You are a helpful sales assistant for Fluvo CRM. Help users manage contacts, track deals, and schedule follow-ups…"
                  [value]="fSystemPrompt()" (input)="fSystemPrompt.set(getInputValue($event))"></textarea>
                <span class="field-hint">Instructions that shape the agent's personality, knowledge, and behavior</span>
              </div>

              <div class="form-grid form-grid--2col">

                <!-- Temperature -->
                <div class="field">
                  <label class="label" for="f-temp">Temperature</label>
                  <input id="f-temp" class="input" type="number" min="0" max="2" step="0.1"
                    [value]="fTemperature()" (input)="fTemperature.set(getInputValue($event))" />
                  @if (temperatureHint()) {
                    <span class="field-hint">{{ temperatureHint() }}</span>
                  }
                </div>

                <!-- Max Tokens -->
                <div class="field">
                  <label class="label" for="f-tokens">Max Tokens</label>
                  <input id="f-tokens" class="input" type="number" min="1" max="32768"
                    [value]="fMaxTokens()" (input)="fMaxTokens.set(getInputValue($event))" />
                  <span class="field-hint">Maximum response length per turn</span>
                </div>

              </div>
            </div>

            <div class="divider" role="separator"></div>

            <!-- ── SECTION: Status ───────────────── -->
            <div class="section">
              <div class="section-head">
                <p class="section-label">Status</p>
                <p class="section-hint">Control whether the agent responds to conversations</p>
              </div>
              <div class="toggle-row">
                <button type="button" role="switch"
                  [attr.aria-checked]="fIsActive()"
                  [attr.aria-label]="fIsActive() ? 'Deactivate agent' : 'Activate agent'"
                  [class.toggle--on]="fIsActive()"
                  class="toggle-btn"
                  (click)="toggleActive()"
                  style="touch-action:manipulation">
                  <span class="toggle-thumb" aria-hidden="true"></span>
                </button>
                <div class="toggle-labels">
                  <p class="toggle-title" [class.toggle-title--on]="fIsActive()">
                    {{ fIsActive() ? 'Active' : 'Inactive' }}
                  </p>
                  <p class="toggle-hint">
                    {{ fIsActive() ? 'Agent is responding to incoming conversations' : 'Agent will not respond to any conversations' }}
                  </p>
                </div>
              </div>
            </div>

          </div>
        }
      }

      <!-- ═══════════════════════════════════════════════ -->
      <!-- LOGS TAB                                        -->
      <!-- ═══════════════════════════════════════════════ -->
      @if (activeTab() === 'logs') {

        <!-- Logs loading skeleton -->
        @if (loadingLogs()) {
          <div class="logs-card" aria-busy="true" aria-label="Loading logs">
            <div class="skel skel--thead"></div>
            @for (_ of skeletons; track $index) {
              <div class="skel skel--row"></div>
            }
          </div>
        }

        <!-- Logs error -->
        @if (!loadingLogs() && errorLogs()) {
          <div class="error-bar" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ errorLogs() }}
            <button class="retry-btn" (click)="loadLogs()" style="touch-action:manipulation">Retry</button>
          </div>
        }

        <!-- Logs empty state -->
        @if (!loadingLogs() && !errorLogs() && logs().length === 0) {
          <div class="logs-card">
            <div class="empty-state" role="status">
              <div class="empty-icon">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="28" height="28" rx="6" stroke="#B8A7FF" stroke-width="2"/>
                  <path d="M10 13h16M10 18h16M10 23h10" stroke="#B8A7FF" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <p class="empty-title">No activity yet</p>
              <p class="empty-sub">Log entries will appear here when the agent starts processing conversations.</p>
            </div>
          </div>
        }

        <!-- Logs table -->
        @if (!loadingLogs() && !errorLogs() && logs().length > 0) {
          <div class="logs-card">
            <div class="table-wrap">
              <table class="logs-table" aria-label="Agent activity logs">
                <thead>
                  <tr>
                    <th scope="col" class="th">Status</th>
                    <th scope="col" class="th th--prompt">Prompt</th>
                    <th scope="col" class="th th--num">Tokens</th>
                    <th scope="col" class="th th--num">Latency</th>
                    <th scope="col" class="th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of logs(); track log.id) {
                    <tr class="log-row">
                      <td class="td">
                        <span class="badge"
                          [style.color]="logStatusCfg(log.status).color"
                          [style.background]="logStatusCfg(log.status).bg">
                          {{ logStatusCfg(log.status).label }}
                        </span>
                      </td>
                      <td class="td td--prompt">
                        <span class="prompt-text" [title]="log.input">{{ truncate(log.input) }}</span>
                      </td>
                      <td class="td td--num">
                        <span class="mono-val">{{ log.tokensUsed ?? '—' }}</span>
                      </td>
                      <td class="td td--num">
                        @if (log.latencyMs !== undefined && log.latencyMs !== null) {
                          <span class="mono-val" [class.latency--slow]="log.latencyMs > 3000">{{ log.latencyMs }}ms</span>
                        } @else {
                          <span class="mono-val">—</span>
                        }
                      </td>
                      <td class="td td--date">{{ log.createdAt | date:'MMM d, h:mm a' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="log-count" aria-live="polite">Showing {{ logs().length }} log {{ logs().length === 1 ? 'entry' : 'entries' }}</p>
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
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .topbar-start { display: flex; flex-direction: column; gap: 3px; }
    .topbar-end { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .page-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .page-sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0;
    }

    /* ── SAVE TOAST ────────────────────────── */
    .save-toast {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #166534;
      animation: fadeIn 0.2s ease both;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

    /* ── BUTTONS ───────────────────────────── */
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
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      padding: 0 16px;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-ghost:hover { background: var(--shallows); border-color: rgba(35,26,51,0.25); }
    .btn-ghost:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 10px; }
    .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── TAB STRIP ─────────────────────────── */
    .tab-strip {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--border);
      margin-bottom: 20px;
    }
    .tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 44px;
      padding: 0 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab--active { color: var(--stream-ink); border-bottom-color: var(--stream-ink); }
    .tab:hover:not(.tab--active) { color: var(--riverbed); }
    .tab:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: -2px; border-radius: 4px; }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #ede9fe;
      color: var(--stream-ink);
      border-radius: 9px;
      font-family: 'DM Mono', monospace;
      font-size: 0.68rem;
      font-weight: 500;
    }

    /* ── CARDS ─────────────────────────────── */
    .config-card,
    .logs-card {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .config-card { padding: 0; max-width: 760px; }

    /* ── CONFIG SECTIONS ───────────────────── */
    .section { padding: 24px; }
    @media (max-width: 640px) { .section { padding: 18px 16px; } }
    .section-head { margin-bottom: 18px; }
    .section-label {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--riverbed);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin: 0 0 3px;
    }
    .section-hint {
      font-family: 'Manrope', sans-serif;
      font-size: 0.85rem;
      color: var(--muted);
      margin: 0;
    }
    .divider {
      height: 1px;
      background: var(--border);
      margin: 0;
    }

    /* ── FORM GRID ─────────────────────────── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-grid--2col { grid-template-columns: 1fr 1fr; }
    .field--span2 { grid-column: span 2; }
    @media (max-width: 560px) {
      .form-grid,
      .form-grid--2col { grid-template-columns: 1fr; }
      .field--span2 { grid-column: span 1; }
    }

    /* ── FIELD ─────────────────────────────── */
    .field { display: flex; flex-direction: column; gap: 5px; }
    .label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--riverbed);
    }
    .label-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .char-count {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .field-hint {
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.4;
    }
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
    .input::placeholder { color: rgba(94,86,110,0.45); }
    .input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 3px rgba(138,118,232,0.12); }
    .input:hover:not(:focus) { border-color: rgba(138,118,232,0.35); }
    .input--textarea { height: auto; padding: 10px 12px; resize: vertical; line-height: 1.6; font-size: 0.875rem; }
    select.input { cursor: pointer; }

    /* ── TOGGLE SWITCH ─────────────────────── */
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
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
    .toggle-labels { display: flex; flex-direction: column; gap: 2px; }
    .toggle-title {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--muted);
      margin: 0;
    }
    .toggle-title--on { color: var(--ready); }
    .toggle-hint {
      font-family: 'Manrope', sans-serif;
      font-size: 0.82rem;
      color: var(--muted);
      margin: 0;
    }

    /* ── FORM ERROR ────────────────────────── */
    .form-error {
      background: #fef2f2;
      border-bottom: 1px solid #fecaca;
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      padding: 12px 24px;
    }

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

    /* ── SKELETON ──────────────────────────── */
    .skel {
      background: linear-gradient(90deg, #f0ebff 0%, #e4ddf8 50%, #f0ebff 100%);
      background-size: 200% 100%;
      border-radius: 6px;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .skel-field { padding: 20px 24px; border-bottom: 1px solid var(--border); }
    .skel-field:last-child { border-bottom: none; }
    .skel--label  { height: 13px; width: 30%; margin-bottom: 10px; }
    .skel--input  { height: 42px; width: 100%; }
    .skel--thead  { height: 44px; margin: 16px 20px 0; border-radius: 8px; }
    .skel--row    { height: 52px; margin: 4px 20px; border-radius: 8px; }

    /* ── LOGS TABLE ────────────────────────── */
    .logs-card { padding: 0; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .logs-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
    }
    .th {
      padding: 12px 16px;
      background: #fafafa;
      border-bottom: 1.5px solid var(--border);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      white-space: nowrap;
    }
    .th--num { text-align: right; }
    .th--prompt { width: 40%; }
    .log-row { transition: background 0.1s; }
    .log-row:hover { background: #fafafa; }
    .log-row + .log-row .td { border-top: 1px solid rgba(35,26,51,0.06); }
    .td {
      padding: 12px 16px;
      color: var(--riverbed);
      vertical-align: middle;
    }
    .td--num { text-align: right; }
    .td--prompt { max-width: 0; }
    .td--date {
      white-space: nowrap;
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      color: var(--muted);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .prompt-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.85rem;
      color: var(--muted);
      max-width: 100%;
    }
    .mono-val {
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      font-weight: 500;
    }
    .latency--slow { color: #ef4444; }
    .log-count {
      padding: 10px 16px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      color: var(--muted);
      border-top: 1px solid var(--border);
      margin: 0;
    }

    /* ── HIDE COLUMNS ON MOBILE ────────────── */
    @media (max-width: 640px) {
      .th--prompt, .td--prompt { display: none; }
    }

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
      margin-bottom: 18px;
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
      max-width: 360px;
      line-height: 1.5;
    }

    /* ── SPINNER ───────────────────────────── */
    .spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── REDUCED MOTION ────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .spinner     { animation: none; opacity: 0.6; }
      .skel        { animation: none; background: #ede9fe; }
      .toggle-thumb, .toggle-btn { transition: none; }
      .save-toast  { animation: none; }
      .btn-primary { transition: none; }
    }
  `],
})
export class AgentConfigComponent implements OnInit {
  private svc = inject(AgentService);

  readonly skeletons = Array(4);

  // Tab
  activeTab = signal<'config' | 'logs'>('config');

  // Config form
  fName         = signal('Default Agent');
  fProvider     = signal('openai');
  fModel        = signal('');
  fSystemPrompt = signal('');
  fTemperature  = signal('0.7');
  fMaxTokens    = signal('1024');
  fIsActive     = signal(true);

  loadingConfig = signal(true);
  errorConfig   = signal('');
  saving        = signal(false);
  saveError     = signal('');
  saveSuccess   = signal(false);

  // Logs
  logs        = signal<AgentLog[]>([]);
  loadingLogs = signal(false);
  errorLogs   = signal('');

  temperatureHint = computed(() => {
    const t = parseFloat(this.fTemperature());
    if (isNaN(t)) return '';
    if (t <= 0.3) return 'More deterministic & precise';
    if (t <= 0.7) return 'Balanced';
    return 'More creative & varied';
  });

  promptLength = computed(() => this.fSystemPrompt().length);

  modelPlaceholder = computed(() => {
    const map: Record<string, string> = {
      openai: 'e.g. gpt-4o',
      anthropic: 'e.g. claude-sonnet-4-6',
      groq: 'e.g. llama-3.3-70b-versatile',
      custom: 'e.g. your-custom-model-id',
    };
    return map[this.fProvider()] ?? 'Model identifier';
  });

  ngOnInit() {
    this.svc.getConfig().subscribe({
      next: (res) => {
        if (res.data) {
          const c = res.data;
          if (c.name         !== undefined) this.fName.set(c.name ?? '');
          if (c.provider     !== undefined) this.fProvider.set(c.provider ?? 'openai');
          if (c.model        !== undefined) this.fModel.set(c.model ?? '');
          if (c.systemPrompt !== undefined) this.fSystemPrompt.set(c.systemPrompt ?? '');
          if (c.temperature  !== undefined) this.fTemperature.set(String(c.temperature));
          if (c.maxTokens    !== undefined) this.fMaxTokens.set(String(c.maxTokens));
          if (c.isActive     !== undefined) this.fIsActive.set(c.isActive ?? true);
        }
        this.loadingConfig.set(false);
      },
      error: () => { this.errorConfig.set('Failed to load configuration.'); this.loadingConfig.set(false); },
    });
    this.loadLogs();
  }

  loadLogs() {
    this.loadingLogs.set(true);
    this.errorLogs.set('');
    this.svc.getLogs().subscribe({
      next: (res) => { this.logs.set(res.data.data); this.loadingLogs.set(false); },
      error: () => { this.errorLogs.set('Failed to load logs.'); this.loadingLogs.set(false); },
    });
  }

  setTab(tab: 'config' | 'logs') { this.activeTab.set(tab); }

  setFProvider(event: Event) { this.fProvider.set(this.getInputValue(event)); }

  toggleActive() { this.fIsActive.update(v => !v); }

  save() {
    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);
    const dto: Partial<AgentConfig> = {
      name:         this.fName().trim(),
      provider:     this.fProvider(),
      model:        this.fModel().trim(),
      systemPrompt: this.fSystemPrompt().trim(),
      temperature:  parseFloat(this.fTemperature()) || 0.7,
      maxTokens:    parseInt(this.fMaxTokens(), 10) || 1024,
      isActive:     this.fIsActive(),
    };
    this.svc.updateConfig(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 2500);
      },
      error: () => { this.saveError.set('Failed to save. Please try again.'); this.saving.set(false); },
    });
  }

  logStatusCfg(status: string) {
    return LOG_STATUS[(status ?? '').toLowerCase()] ?? { label: status ?? '—', color: '#374151', bg: '#f3f4f6' };
  }

  truncate(s: string, n = 72): string {
    return s && s.length > n ? s.slice(0, n) + '…' : (s ?? '—');
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
