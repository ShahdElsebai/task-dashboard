import { StatCardConfig } from './dashboard-stat-card.model';

export const STAT_CARDS: readonly StatCardConfig[] = [
  { id: 'stat-001', titleKey: 'stats.total', stat: 'total', iconClass: 'text-status-todo' },
  { id: 'stat-002', titleKey: 'stats.completed', stat: 'completed', iconClass: 'text-status-done' },
  { id: 'stat-003', titleKey: 'stats.inProgress', stat: 'inProgress', iconClass: 'text-status-progress' },
  { id: 'stat-004', titleKey: 'stats.overdue', stat: 'overdue', iconClass: 'text-status-overdue' },
];
