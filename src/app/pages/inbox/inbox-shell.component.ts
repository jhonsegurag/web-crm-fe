import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InboxService } from './inbox.service';
import { Conversation, Message } from '../../shared/types';

const FILTERS = [
  { label: 'All',      value: 'all' },
  { label: 'Open',     value: 'open' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
] as const;

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', color: '#22A565' },
  email:    { label: 'Email',    color: '#8A76E8' },
  sms:      { label: 'SMS',      color: '#FF6B2C' },
  chat:     { label: 'Chat',     color: '#B8A7FF' },
};

@Component({
  selector: 'app-inbox-shell',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="inbox" role="region" aria-label="Inbox">

      <!-- ── LEFT: CONVERSATION LIST ───── -->
      <aside class="conv-sidebar" aria-label="Conversations">
        <div class="sidebar-head">
          <h1 class="sidebar-title">Inbox</h1>

          <!-- Search -->
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="#5E566E" stroke-width="1.75"/>
              <path d="M13.5 13.5L17 17" stroke="#5E566E" stroke-width="1.75" stroke-linecap="round"/>
            </svg>
            <input type="search" class="search-input" placeholder="Search conversations…"
              [value]="search()" (input)="search.set($any($event.target).value)"
              aria-label="Search conversations">
          </div>

          <!-- Filter tabs -->
          <div class="filter-tabs" role="tablist" aria-label="Filter conversations">
            @for (f of filters; track f.value) {
              <button class="filter-tab" [class.active]="activeFilter() === f.value"
                (click)="activeFilter.set(f.value)" role="tab"
                [attr.aria-selected]="activeFilter() === f.value">
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        <div class="conv-list-wrap">
          <!-- Loading skeleton -->
          @if (loading()) {
            <div class="conv-list" aria-busy="true" aria-label="Loading conversations">
              @for (_ of skeletonRows; track $index) {
                <div class="conv-skeleton">
                  <div class="skel skel-avatar"></div>
                  <div class="skel-body">
                    <div class="skel skel-name"></div>
                    <div class="skel skel-preview"></div>
                  </div>
                </div>
              }
            </div>
          <!-- Error -->
          } @else if (error()) {
            <div class="state-center">
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" class="state-icon">
                <circle cx="24" cy="24" r="20" stroke="#FF6B2C" stroke-width="2.5"/>
                <path d="M24 14v12M24 32v2" stroke="#FF6B2C" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <p class="state-text">Couldn't load conversations.</p>
              <button class="btn-retry" (click)="loadConversations()">Try again</button>
            </div>
          <!-- Empty -->
          } @else if (filtered().length === 0) {
            <div class="state-center">
              <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" class="state-icon">
                <path d="M8 10h32a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" stroke="#B8A7FF" stroke-width="2.5"/>
                <path d="M4 18l20 12 20-12" stroke="#B8A7FF" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <p class="state-text">{{ search() ? 'No results for "' + search() + '"' : 'No conversations yet.' }}</p>
              @if (!search()) {
                <p class="state-hint">New chats will appear here.</p>
              }
            </div>
          <!-- List -->
          } @else {
            <div class="conv-list" role="list">
              @for (conv of filtered(); track conv.id) {
                <button class="conv-item" [class.conv-item--active]="selected()?.id === conv.id"
                  (click)="selectConversation(conv)" role="listitem"
                  [attr.aria-pressed]="selected()?.id === conv.id"
                  [attr.aria-label]="convAriaLabel(conv)">
                  <div class="conv-avatar" [style.background]="avatarColor(conv)" aria-hidden="true">
                    {{ initials(conv) }}
                  </div>
                  <div class="conv-body">
                    <div class="conv-row1">
                      <span class="conv-name">{{ contactName(conv) }}</span>
                      <span class="conv-time">{{ timeAgo(conv.lastMessageAt ?? conv.createdAt) }}</span>
                    </div>
                    <div class="conv-row2">
                      <span class="conv-preview">{{ conv.subject ?? 'No subject' }}</span>
                      <span class="conv-channel-badge"
                        [style.background]="channelColor(conv.channel) + '22'"
                        [style.color]="channelColor(conv.channel)">
                        {{ channelLabel(conv.channel) }}
                      </span>
                    </div>
                  </div>
                </button>
              }
            </div>
          }
        </div>
      </aside>

      <!-- ── RIGHT: THREAD PANEL ────────── -->
      <main class="thread-panel" role="main">
        @if (loadingMessages()) {
          <div class="thread-loading" aria-busy="true" aria-label="Loading messages">
            <div class="msg-skeleton msg-skeleton--in">
              <div class="skel skel-avatar-sm"></div>
              <div class="skel skel-bubble skel-bubble--in"></div>
            </div>
            <div class="msg-skeleton msg-skeleton--out">
              <div class="skel skel-bubble skel-bubble--out"></div>
            </div>
            <div class="msg-skeleton msg-skeleton--in">
              <div class="skel skel-avatar-sm"></div>
              <div class="skel skel-bubble skel-bubble--in" style="width:55%"></div>
            </div>
            <div class="msg-skeleton msg-skeleton--out">
              <div class="skel skel-bubble skel-bubble--out" style="width:40%"></div>
            </div>
          </div>

        } @else if (selected()) {
          <!-- THREAD HEADER -->
          <header class="thread-header">
            <div class="thread-avatar" [style.background]="avatarColor(selected()!)" aria-hidden="true">
              {{ initials(selected()!) }}
            </div>
            <div class="thread-info">
              <span class="thread-name">{{ contactName(selected()!) }}</span>
              <span class="thread-meta">
                <span class="channel-pill"
                  [style.background]="channelColor(selected()!.channel) + '18'"
                  [style.color]="channelColor(selected()!.channel)">
                  {{ channelLabel(selected()!.channel) }}
                </span>
                <span class="status-pill" [class]="'status-pill--' + selected()!.status">
                  {{ selected()!.status }}
                </span>
              </span>
            </div>
          </header>

          <!-- MESSAGES -->
          <div class="messages" role="log" aria-live="polite" aria-label="Conversation messages" #msgContainer>
            @for (msg of messages(); track msg.id; let i = $index) {
              @if (showDateSep(i)) {
                <div class="date-sep" role="separator">
                  <span>{{ dateLabel(msg.createdAt) }}</span>
                </div>
              }
              <div class="msg-row" [class]="'msg-row--' + msg.senderType">
                @if (msg.senderType !== 'user') {
                  <div class="msg-avatar" aria-hidden="true">
                    {{ msg.senderType === 'agent' ? 'AI' : initials(selected()!) }}
                  </div>
                }
                <div class="msg-bubble" [class]="'msg-bubble--' + msg.senderType"
                  [attr.aria-label]="msg.senderType + ': ' + msg.content">
                  <p class="msg-text">{{ msg.content }}</p>
                  <div class="msg-footer">
                    <span class="msg-time">{{ msg.createdAt | date:'shortTime' }}</span>
                    @if (msg.senderType === 'user') {
                      <svg class="msg-read" [class.msg-read--done]="msg.isRead"
                        viewBox="0 0 16 10" fill="none" aria-hidden="true">
                        <path d="M1 5l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6 5l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    }
                  </div>
                </div>
              </div>
            }
            <div #msgEnd></div>
          </div>

          <!-- COMPOSER -->
          <div class="composer" role="form" aria-label="Compose message">
            <textarea class="composer-input" placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              [value]="newMessage()"
              (input)="onComposerInput($event)"
              (keydown)="onComposerKey($event)"
              rows="1"
              aria-label="Message text"
              [attr.aria-disabled]="sending()"></textarea>
            <button class="send-btn" (click)="send()"
              [disabled]="!newMessage().trim() || sending()"
              aria-label="Send message">
              @if (sending()) {
                <svg class="send-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-dasharray="40" stroke-dashoffset="10"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              }
            </button>
          </div>

        } @else {
          <!-- EMPTY STATE -->
          <div class="empty-thread" aria-label="No conversation selected">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="empty-icon">
              <circle cx="40" cy="40" r="36" fill="#F1EEF8"/>
              <path d="M24 28h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4z" stroke="#B8A7FF" stroke-width="2.5"/>
              <path d="M20 36l20 12 20-12" stroke="#B8A7FF" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M24 60l6-6" stroke="#FF6B2C" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="56" cy="28" r="8" fill="#FF6B2C"/>
              <path d="M56 24v5M56 31v1" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h2 class="empty-title">Select a conversation</h2>
            <p class="empty-sub">Choose from the list on the left to start reading and replying.</p>
          </div>
        }
      </main>
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
      --border:     rgba(35,26,51,0.08);
    }

    /* ── LAYOUT ──────────────────────────── */
    .inbox {
      display: flex;
      height: calc(100dvh - 64px);
      font-family: 'Manrope', sans-serif;
      overflow: hidden;
    }

    /* ── CONVERSATION SIDEBAR ────────────── */
    .conv-sidebar {
      width: 320px;
      flex-shrink: 0;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      background: #fff;
    }
    .sidebar-head {
      padding: 16px 16px 10px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .sidebar-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 12px;
    }

    /* Search */
    .search-box { position: relative; margin-bottom: 10px; }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: var(--riverbed);
      background: var(--shallows);
      border: 2px solid transparent;
      border-radius: 10px;
      padding: 9px 12px 9px 34px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
      min-height: 40px;
    }
    .search-input::placeholder { color: #A89EC0; }
    .search-input:focus { border-color: var(--stream-ink); background: #fff; }

    /* Filter tabs */
    .filter-tabs { display: flex; gap: 2px; }
    .filter-tab {
      flex: 1;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--muted);
      background: none;
      border: none;
      padding: 6px 4px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      min-height: 32px;
    }
    .filter-tab:hover { background: var(--shallows); color: var(--riverbed); }
    .filter-tab:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; }
    .filter-tab.active {
      background: rgba(138,118,232,0.12);
      color: var(--stream-ink);
      font-weight: 600;
    }

    /* List scroll area */
    .conv-list-wrap {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(35,26,51,0.12) transparent;
    }
    .conv-list { display: flex; flex-direction: column; }

    /* ── SKELETON ────────────────────────── */
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    .skel {
      border-radius: 6px;
      background: linear-gradient(90deg, #F1EEF8 25%, #E8E4F3 50%, #F1EEF8 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .skel { animation: none; background: #F1EEF8; }
    }
    .conv-skeleton {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .skel-avatar     { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
    .skel-avatar-sm  { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
    .skel-body       { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skel-name       { height: 13px; width: 55%; }
    .skel-preview    { height: 11px; width: 80%; }
    .skel-bubble     { height: 52px; border-radius: 14px; width: 65%; }
    .skel-bubble--in  { border-radius: 4px 14px 14px 14px; }
    .skel-bubble--out { border-radius: 14px 4px 14px 14px; margin-left: auto; }

    /* ── STATE CENTERS ───────────────────── */
    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      gap: 10px;
    }
    .state-icon { width: 48px; height: 48px; margin-bottom: 4px; }
    .state-text { font-size: 0.9375rem; font-weight: 500; color: var(--riverbed); margin: 0; text-align: center; }
    .state-hint { font-size: 0.875rem; color: var(--muted); margin: 0; text-align: center; }
    .btn-retry {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--stream-ink);
      background: rgba(138,118,232,0.1);
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 4px;
      min-height: 36px;
    }
    .btn-retry:hover { background: rgba(138,118,232,0.18); }
    .btn-retry:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    /* ── CONVERSATION ITEM ───────────────── */
    .conv-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border: none;
      border-bottom: 1px solid var(--border);
      background: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: background 0.15s;
      position: relative;
    }
    .conv-item:hover { background: var(--shallows); }
    .conv-item:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: -2px; }
    .conv-item--active { background: rgba(138,118,232,0.07); }
    .conv-item--active::before {
      content: '';
      position: absolute;
      left: 0; top: 8px; bottom: 8px;
      width: 3px;
      background: var(--stream-ink);
      border-radius: 0 3px 3px 0;
    }
    .conv-avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--riverbed);
    }
    .conv-body { flex: 1; min-width: 0; }
    .conv-row1 {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 3px;
    }
    .conv-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--riverbed);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .conv-time {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      color: var(--muted);
      flex-shrink: 0;
    }
    .conv-row2 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .conv-preview {
      font-size: 0.8125rem;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .conv-channel-badge {
      font-family: 'DM Mono', monospace;
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 100px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── THREAD PANEL ────────────────────── */
    .thread-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fafafa;
    }

    /* Loading */
    .thread-loading {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow: hidden;
    }
    .msg-skeleton { display: flex; align-items: flex-end; gap: 10px; }
    .msg-skeleton--out { flex-direction: row-reverse; }

    /* Thread header */
    .thread-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      background: #fff;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .thread-avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--riverbed);
    }
    .thread-info { display: flex; flex-direction: column; gap: 4px; }
    .thread-name { font-size: 1rem; font-weight: 700; color: var(--riverbed); }
    .thread-meta { display: flex; align-items: center; gap: 8px; }
    .channel-pill {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 2px 10px;
      border-radius: 100px;
    }
    .status-pill {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 100px;
      text-transform: capitalize;
    }
    .status-pill--open     { background: rgba(34,165,101,0.12);  color: var(--ready); }
    .status-pill--pending  { background: rgba(242,179,61,0.15);  color: #b45309; }
    .status-pill--resolved { background: rgba(184,167,255,0.2);  color: var(--stream-ink); }
    .status-pill--archived { background: rgba(94,86,110,0.12);   color: var(--muted); }

    /* Messages */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      scrollbar-width: thin;
      scrollbar-color: rgba(35,26,51,0.12) transparent;
    }

    /* Date separator */
    .date-sep {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0 8px;
      color: var(--muted);
    }
    .date-sep::before,
    .date-sep::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .date-sep span {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    /* Message rows */
    .msg-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 75%;
      margin-bottom: 4px;
    }
    .msg-row--user    { align-self: flex-end; flex-direction: row-reverse; }
    .msg-row--contact { align-self: flex-start; }
    .msg-row--agent   { align-self: flex-start; }

    .msg-avatar {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border-radius: 50%;
      background: var(--stream);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--riverbed);
      flex-shrink: 0;
    }
    .msg-bubble { padding: 10px 14px; border-radius: 18px; word-break: break-word; overflow-wrap: anywhere; }
    .msg-bubble--user    { background: var(--stream-ink); color: #fff; border-radius: 18px 4px 18px 18px; }
    .msg-bubble--contact { background: #fff; color: var(--riverbed); border: 1px solid var(--border); border-radius: 4px 18px 18px 18px; }
    .msg-bubble--agent   { background: rgba(255,107,44,0.08); color: var(--riverbed); border: 1px solid rgba(255,107,44,0.2); border-radius: 4px 18px 18px 18px; }
    .msg-text { margin: 0 0 4px; font-size: 0.9375rem; line-height: 1.55; }
    .msg-footer { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
    .msg-time { font-family: 'DM Mono', monospace; font-size: 0.6875rem; opacity: 0.6; }
    .msg-read { width: 16px; height: 10px; color: rgba(255,255,255,0.45); flex-shrink: 0; }
    .msg-read--done { color: rgba(255,255,255,0.9); }

    /* Composer */
    .composer {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      padding: 14px 20px;
      background: #fff;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .composer-input {
      flex: 1;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      color: var(--riverbed);
      background: var(--shallows);
      border: 2px solid transparent;
      border-radius: 14px;
      padding: 10px 14px;
      outline: none;
      resize: none;
      overflow-y: auto;
      max-height: 120px;
      line-height: 1.5;
      transition: border-color 0.2s;
      scrollbar-width: thin;
    }
    .composer-input::placeholder { color: #A89EC0; }
    .composer-input:focus { border-color: var(--stream-ink); background: #fff; }
    .send-btn {
      width: 44px;
      height: 44px;
      min-width: 44px;
      border-radius: 50%;
      background: var(--stream-ink);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      transition: background 0.2s, transform 0.15s, opacity 0.2s;
      flex-shrink: 0;
    }
    .send-btn svg { width: 18px; height: 18px; }
    .send-btn:hover:not(:disabled) { background: var(--riverbed); transform: scale(1.05); }
    .send-btn:focus-visible { outline: 3px solid var(--stream-ink); outline-offset: 3px; }
    .send-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .send-spinner { animation: spin 0.8s linear infinite; }
    @media (prefers-reduced-motion: reduce) { .send-spinner { animation: none; } }

    /* ── EMPTY THREAD ────────────────────── */
    .empty-thread {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
      gap: 12px;
    }
    .empty-icon { width: 80px; height: 80px; margin-bottom: 4px; }
    .empty-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0;
    }
    .empty-sub {
      font-size: 0.9375rem;
      color: var(--muted);
      margin: 0;
      text-align: center;
      max-width: 280px;
      line-height: 1.6;
    }

    /* ── RESPONSIVE ──────────────────────── */
    @media (max-width: 768px) {
      .conv-sidebar { width: 100%; border-right: none; }
      .thread-panel { display: none; }
    }
  `],
})
export class InboxShellComponent implements OnInit {
  private svc = inject(InboxService);

  @ViewChild('msgEnd') private msgEnd?: ElementRef<HTMLElement>;

  conversations   = signal<Conversation[]>([]);
  messages        = signal<Message[]>([]);
  selected        = signal<Conversation | null>(null);
  loading         = signal(false);
  loadingMessages = signal(false);
  sending         = signal(false);
  error           = signal<string | null>(null);
  newMessage      = signal('');
  search          = signal('');
  activeFilter    = signal<string>('all');

  readonly filters     = FILTERS;
  readonly skeletonRows = Array(6);

  filtered = computed(() => {
    let list = this.conversations();
    const f = this.activeFilter();
    if (f !== 'all') list = list.filter((c) => c.status === f);
    const q = this.search().toLowerCase().trim();
    if (q) {
      list = list.filter((c) => {
        const name = `${c.contact?.firstName ?? ''} ${c.contact?.lastName ?? ''}`.toLowerCase();
        return name.includes(q) || (c.subject ?? '').toLowerCase().includes(q);
      });
    }
    return list;
  });

  ngOnInit() { this.loadConversations(); }

  loadConversations() {
    this.loading.set(true);
    this.error.set(null);
    this.svc.listConversations().subscribe({
      next:  (res) => { this.conversations.set(res.data.data); this.loading.set(false); },
      error: ()    => { this.error.set('Could not load conversations.'); this.loading.set(false); },
    });
  }

  selectConversation(conv: Conversation) {
    this.selected.set(conv);
    this.loadingMessages.set(true);
    this.svc.getMessages(conv.id).subscribe({
      next: (res) => {
        this.messages.set(res.data.data);
        this.loadingMessages.set(false);
        setTimeout(() => this.scrollToBottom(), 60);
      },
      error: () => this.loadingMessages.set(false),
    });
  }

  send() {
    const conv = this.selected();
    const text = this.newMessage().trim();
    if (!conv || !text || this.sending()) return;
    this.sending.set(true);
    this.svc.sendMessage(conv.id, text).subscribe({
      next: (res) => {
        this.messages.update((msgs) => [...msgs, res.data]);
        this.newMessage.set('');
        this.sending.set(false);
        setTimeout(() => this.scrollToBottom(), 40);
      },
      error: () => this.sending.set(false),
    });
  }

  onComposerInput(e: Event) {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    this.newMessage.set(el.value);
  }

  onComposerKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  private scrollToBottom() {
    this.msgEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  contactName(conv: Conversation): string {
    if (!conv.contact) return 'Unknown';
    return [conv.contact.firstName, conv.contact.lastName].filter(Boolean).join(' ');
  }

  initials(conv: Conversation): string {
    const f = conv.contact?.firstName?.[0] ?? '?';
    const l = conv.contact?.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  avatarColor(conv: Conversation): string {
    const palette = ['#B8A7FF', '#FF6B2C', '#22A565', '#8A76E8', '#F2B33D'];
    return palette[(conv.contact?.firstName?.charCodeAt(0) ?? 0) % palette.length];
  }

  channelLabel(ch: string): string { return CHANNEL_META[ch]?.label ?? ch; }
  channelColor(ch: string): string { return CHANNEL_META[ch]?.color ?? '#8A76E8'; }

  convAriaLabel(conv: Conversation): string {
    return `${this.contactName(conv)}, ${conv.status}, via ${this.channelLabel(conv.channel)}, ${this.timeAgo(conv.lastMessageAt ?? conv.createdAt)}`;
  }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (mins  < 1)  return 'just now';
    if (mins  < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days  <  7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  showDateSep(index: number): boolean {
    const msgs = this.messages();
    if (index === 0) return true;
    return new Date(msgs[index - 1].createdAt).toDateString() !== new Date(msgs[index].createdAt).toDateString();
  }

  dateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
}
