import { NavItem } from '../models/navigation.model';

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.dashboard', icon: 'pi pi-th-large', path: 'dashboard' },
  { labelKey: 'nav.tasks', icon: 'pi pi-check-square', path: 'tasks' },
  { labelKey: 'nav.calendar', icon: 'pi pi-calendar', path: 'calendar' },
  { labelKey: 'nav.analytics', icon: 'pi pi-chart-bar', path: 'analytics' },
  { labelKey: 'nav.team', icon: 'pi pi-users', path: 'team' },
  { labelKey: 'nav.settings', icon: 'pi pi-cog', path: 'settings' },
];
