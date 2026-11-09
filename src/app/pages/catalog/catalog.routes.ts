import { Routes } from '@angular/router';
export const CATALOG_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./catalog-shell.component').then((m) => m.CatalogShellComponent) },
];
