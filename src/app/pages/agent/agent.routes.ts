import { Routes } from '@angular/router';
export const AGENT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./agent-config.component').then((m) => m.AgentConfigComponent) },
];
