import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './core/layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'inbox',         loadChildren: () => import('./pages/inbox/inbox.routes').then((m) => m.INBOX_ROUTES) },
      { path: 'pipeline',      loadChildren: () => import('./pages/pipeline/pipeline.routes').then((m) => m.PIPELINE_ROUTES) },
      { path: 'contacts',      loadChildren: () => import('./pages/contacts/contacts.routes').then((m) => m.CONTACTS_ROUTES) },
      { path: 'orders',        loadChildren: () => import('./pages/orders/orders.routes').then((m) => m.ORDERS_ROUTES) },
      { path: 'catalog',       loadChildren: () => import('./pages/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES) },
      { path: 'map',           loadChildren: () => import('./pages/map/map.routes').then((m) => m.MAP_ROUTES) },
      { path: 'agenda',        loadChildren: () => import('./pages/agenda/agenda.routes').then((m) => m.AGENDA_ROUTES) },
      { path: 'agent',         loadChildren: () => import('./pages/agent/agent.routes').then((m) => m.AGENT_ROUTES) },
      { path: 'labs',          loadChildren: () => import('./pages/labs/labs.routes').then((m) => m.LABS_ROUTES) },
      { path: 'business',      loadChildren: () => import('./pages/business/business.routes').then((m) => m.BUSINESS_ROUTES) },
      { path: 'configuration', loadChildren: () => import('./pages/configuration/configuration.routes').then((m) => m.CONFIGURATION_ROUTES) },
      { path: '', redirectTo: 'inbox', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
