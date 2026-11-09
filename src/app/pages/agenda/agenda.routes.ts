import { Routes } from '@angular/router';
export const AGENDA_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./agenda-calendar.component').then((m) => m.AgendaCalendarComponent) },
];
