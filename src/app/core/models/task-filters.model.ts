import type { TaskPriority, TaskStatus } from '../dto/enum.dto';

export interface TaskFilters {
  search: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  assigneeId: string | null;
}

export const EMPTY_FILTERS: TaskFilters = { search: '', status: null, priority: null, assigneeId: null };
