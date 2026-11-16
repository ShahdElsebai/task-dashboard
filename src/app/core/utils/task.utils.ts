import type { TaskDto } from '../dto/task.dto';
import { TaskStatus } from '../dto/enum.dto';
import { daysBetween, parseDateOnly } from './date.utils';

/**
 * A task is overdue when its due day is before today and it isn't done.
 * Computed on the fly because the API's `isOverdue` goes stale.
 */
export function isTaskOverdue(
  task: Pick<TaskDto, 'status' | 'dueDate'>,
  today: Date = new Date(),
): boolean {
  return task.status !== TaskStatus.Done && daysBetween(today, parseDateOnly(task.dueDate)) < 0;
}
