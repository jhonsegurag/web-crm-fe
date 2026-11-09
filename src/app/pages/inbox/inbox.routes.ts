import { Routes } from '@angular/router';

export const INBOX_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inbox-shell.component').then((m) => m.InboxShellComponent),
  },
];
