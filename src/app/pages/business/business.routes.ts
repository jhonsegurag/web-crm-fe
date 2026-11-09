import { Routes } from '@angular/router';
export const BUSINESS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./business-settings.component').then((m) => m.BusinessSettingsComponent) },
];
