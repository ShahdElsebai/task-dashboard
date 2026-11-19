import { TaskPriority, TaskStatus } from '@core/dto';

import { PrioritySliceConfig, StatusSliceConfig } from './analytics.model';

export const STATUS_SLICES: readonly StatusSliceConfig[] = [
  { key: TaskStatus.Todo, labelKey: 'board.columns.todo', color: '#1976d2', swatchClass: 'bg-status-todo' },
  {
    key: TaskStatus.InProgress,
    labelKey: 'board.columns.inProgress',
    color: '#f57c00',
    swatchClass: 'bg-status-progress',
  },
  { key: TaskStatus.Done, labelKey: 'board.columns.done', color: '#2e7d32', swatchClass: 'bg-status-done' },
];

export const PRIORITY_SLICES: readonly PrioritySliceConfig[] = [
  { key: TaskPriority.High, labelKey: 'priority.high', color: '#c62828', swatchClass: 'bg-priority-high' },
  { key: TaskPriority.Medium, labelKey: 'priority.medium', color: '#c2410c', swatchClass: 'bg-priority-medium' },
  { key: TaskPriority.Low, labelKey: 'priority.low', color: '#33691e', swatchClass: 'bg-priority-low' },
];

export const FEED_SIZE: number = 10;
