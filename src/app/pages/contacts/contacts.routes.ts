import { Routes } from '@angular/router';

export const CONTACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./contact-list.component').then((m) => m.ContactListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./contact-list.component').then((m) => m.ContactListComponent),
  },
];
