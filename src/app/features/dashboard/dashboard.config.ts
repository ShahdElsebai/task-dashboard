import { TaskStatus } from '../../core/dto';
import { BoardColumnConfig, TaskFilters } from './dashboard.model';

export const BOARD_COLUMNS: readonly BoardColumnConfig[] = [
  { status: TaskStatus.Todo, titleKey: 'board.columns.todo' },
  { status: TaskStatus.InProgress, titleKey: 'board.columns.inProgress' },
  { status: TaskStatus.Done, titleKey: 'board.columns.done' },
];

export const EMPTY_FILTERS: TaskFilters = { search: '', status: null, priority: null, assigneeId: null };
