import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./layout/layout.component.route').then((m: { LayoutRoutes: Routes }) => m.LayoutRoutes),
  },
];
