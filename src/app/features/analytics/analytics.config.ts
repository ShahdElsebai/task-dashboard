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
  { key: TaskStatus.Done, labelKey: 'board.columns.done', color: '#43a047', swatchClass: 'bg-status-done' },
];

export const PRIORITY_SLICES: readonly PrioritySliceConfig[] = [
  { key: TaskPriority.High, labelKey: 'priority.high', color: '#d32f2f', swatchClass: 'bg-priority-high' },
  { key: TaskPriority.Medium, labelKey: 'priority.medium', color: '#ef6c00', swatchClass: 'bg-priority-medium' },
  { key: TaskPriority.Low, labelKey: 'priority.low', color: '#558b2f', swatchClass: 'bg-priority-low' },
];

export const FEED_SIZE: number = 10;
