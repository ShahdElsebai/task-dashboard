import { TaskStatus } from '@core/dto';

import { BoardColumnConfig, TaskFieldFilters, TaskFilters } from './dashboard.model';

export const BOARD_COLUMNS: readonly BoardColumnConfig[] = [
  { status: TaskStatus.Todo, titleKey: 'board.columns.todo' },
  { status: TaskStatus.InProgress, titleKey: 'board.columns.inProgress' },
  { status: TaskStatus.Done, titleKey: 'board.columns.done' },
];

export const EMPTY_FIELD_FILTERS: TaskFieldFilters = { status: null, priority: null, assigneeId: null };

export const EMPTY_FILTERS: TaskFilters = { ...EMPTY_FIELD_FILTERS, search: '' };

export const POSITION_GAP: number = 1000;

export const TASKS_API_PATH: string = 'tasks';
