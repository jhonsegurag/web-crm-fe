import { Routes } from '@angular/router';
export const LABS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./labs-panel.component').then((m) => m.LabsPanelComponent) },
];
