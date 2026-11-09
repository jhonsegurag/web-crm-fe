import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { authStore } from '../../store/auth.store';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <!-- SIDEBAR -->
      <mat-sidenav #sidenav mode="side" [opened]="sidenavOpen()" class="sidebar"
        role="navigation" aria-label="App navigation">
        <div class="sidebar-brand">
          <img src="assets/fluvo/lockups/fluvo-lockup-on-dark.svg" alt="Fluvo" height="30" width="134">
          <button mat-icon-button class="collapse-btn" (click)="toggleSidenav()" aria-label="Collapse sidebar">
            <mat-icon>chevron_left</mat-icon>
          </button>
        </div>

        <nav class="nav-section">
          @for (item of navItems; track item.route) {
            <a class="nav-item" [routerLink]="item.route" routerLinkActive="nav-item--active"
               [matTooltip]="item.label" matTooltipPosition="right">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button mat-button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </div>
      </mat-sidenav>

      <!-- MAIN CONTENT -->
      <mat-sidenav-content class="main-wrapper">
        <header class="topbar" role="banner">
          <button mat-icon-button class="menu-btn" (click)="toggleSidenav()"
            [attr.aria-label]="sidenavOpen() ? 'Collapse sidebar' : 'Expand sidebar'">
            <mat-icon>{{ sidenavOpen() ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          @if (!sidenavOpen()) {
            <img src="assets/fluvo/icon/fluvo-app-icon.svg" alt="Fluvo" height="28" width="28" class="topbar-logo">
          }
          <span class="topbar-spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu" class="user-btn">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </header>

        <main class="page-content" id="app-main">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      --riverbed:   #231A33;
      --shallows:   #F1EEF8;
      --stream:     #B8A7FF;
      --stream-ink: #8A76E8;
      --current:    #FF6B2C;
      --muted-fg:   rgba(241,238,248,0.55);
    }

    .shell { height: 100dvh; }

    /* ── SIDEBAR ─────────────────────────── */
    ::ng-deep .sidebar {
      width: 248px !important;
      background: var(--riverbed) !important;
      border-right: none !important;
    }
    ::ng-deep .sidebar .mat-drawer-inner-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 12px 0 20px;
      border-bottom: 1px solid rgba(241,238,248,0.07);
      flex-shrink: 0;
    }
    .collapse-btn { color: var(--muted-fg) !important; }
    .collapse-btn:hover { color: var(--shallows) !important; }
    .collapse-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 4px; }

    .nav-section {
      flex: 1;
      overflow-y: auto;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      scrollbar-width: thin;
      scrollbar-color: rgba(184,167,255,0.2) transparent;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      border-radius: 10px;
      text-decoration: none;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--muted-fg);
      transition: background 0.18s ease, color 0.18s ease;
      min-height: 44px;
      white-space: nowrap;
      overflow: hidden;
    }
    .nav-item:hover { background: rgba(184,167,255,0.1); color: rgba(241,238,248,0.9); }
    .nav-item:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 1px; border-radius: 10px; }
    .nav-item--active { background: rgba(184,167,255,0.18) !important; color: var(--stream) !important; }
    .nav-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; color: inherit; }
    .nav-label { overflow: hidden; text-overflow: ellipsis; }

    .sidebar-footer {
      padding: 10px;
      border-top: 1px solid rgba(241,238,248,0.07);
      flex-shrink: 0;
    }
    .logout-btn {
      width: 100% !important;
      display: flex !important;
      align-items: center;
      gap: 12px;
      padding: 9px 14px !important;
      border-radius: 10px !important;
      font-family: 'Manrope', sans-serif !important;
      font-size: 0.9rem !important;
      font-weight: 500 !important;
      color: var(--muted-fg) !important;
      justify-content: flex-start !important;
      min-height: 44px !important;
      transition: background 0.18s, color 0.18s !important;
    }
    .logout-btn:hover { background: rgba(220,38,38,0.12) !important; color: #fca5a5 !important; }
    .logout-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* ── TOPBAR ──────────────────────────── */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 40;
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      background: #fff;
      border-bottom: 1px solid rgba(35,26,51,0.07);
      gap: 8px;
    }
    .menu-btn { color: var(--riverbed) !important; }
    .menu-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 4px; }
    .topbar-logo { margin-left: 4px; }
    .topbar-spacer { flex: 1; }
    .user-btn { color: var(--riverbed) !important; }
    .user-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; border-radius: 4px; }

    /* ── PAGE CONTENT ────────────────────── */
    .main-wrapper { display: flex; flex-direction: column; overflow: hidden; }
    .page-content { flex: 1; overflow: auto; }
  `],
})
export class AppLayoutComponent {
  sidenavOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'Inbox',         icon: 'chat_bubble',    route: '/inbox' },
    { label: 'Pipeline',      icon: 'view_kanban',    route: '/pipeline' },
    { label: 'Contacts',      icon: 'contacts',       route: '/contacts' },
    { label: 'Orders',        icon: 'receipt_long',   route: '/orders' },
    { label: 'Catalog',       icon: 'inventory_2',    route: '/catalog' },
    { label: 'Map',           icon: 'map',            route: '/map' },
    { label: 'Agenda',        icon: 'calendar_today', route: '/agenda' },
    { label: 'Agent',         icon: 'smart_toy',      route: '/agent' },
    { label: 'Labs',          icon: 'science',        route: '/labs' },
    { label: 'Business',      icon: 'business',       route: '/business' },
    { label: 'Configuration', icon: 'settings',       route: '/configuration' },
  ];

  toggleSidenav() { this.sidenavOpen.update((v) => !v); }
  logout() { authStore.logout(); }
}
