import { Route, Routes } from '@angular/router';

import { LayoutComponent } from './layout.component';

const comingSoon: (titleKey: string, icon: string) => Route = (titleKey: string, icon: string): Route => ({
  data: { titleKey, icon },
  loadComponent: () =>
    import('../features/coming-soon/coming-soon.component').then(
      (m: typeof import('../features/coming-soon/coming-soon.component')) => m.ComingSoonComponent
    ),
});

export const LayoutRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/dashboard/dashboard.component').then(
            (m: typeof import('../features/dashboard/dashboard.component')) => m.DashboardComponent
          ),
      },
      { path: 'tasks', ...comingSoon('nav.tasks', 'pi pi-check-square') },
      { path: 'calendar', ...comingSoon('nav.calendar', 'pi pi-calendar') },
      {
        path: 'analytics',
        loadComponent: () =>
          import('../features/analytics/analytics.component').then(
            (m: typeof import('../features/analytics/analytics.component')) => m.AnalyticsComponent
          ),
      },
      {
        path: 'team',
        loadComponent: () =>
          import('../features/team/team.component').then(
            (m: typeof import('../features/team/team.component')) => m.TeamComponent
          ),
      },
      { path: 'settings', ...comingSoon('nav.settings', 'pi pi-cog') },
      {
        path: '**',
        loadComponent: () =>
          import('../features/not-found/not-found.component').then(
            (m: typeof import('../features/not-found/not-found.component')) => m.NotFoundComponent
          ),
      },
    ],
  },
];
