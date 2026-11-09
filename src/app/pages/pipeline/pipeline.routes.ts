import { Routes } from '@angular/router';
export const PIPELINE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pipeline-board.component').then((m) => m.PipelineBoardComponent) },
];
