import { Routes } from '@angular/router';
export const CONFIGURATION_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./config-shell.component').then((m) => m.ConfigShellComponent) },
];
