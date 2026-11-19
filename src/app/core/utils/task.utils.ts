import { TaskDto, TaskStatus } from '../dto';
import { daysBetween, parseDateOnly } from './date.utils';

/**
 * Whether a task is past its due date and not done.
 *
 * Computed on the fly instead of using the API's `isOverdue` flag, which is only correct
 * on the day the data was generated.
 *
 * @param task The task (only its status and due date are used).
 * @param today The date to compare with; injectable for tests.
 * @return True when the due date is before today and the task isn't done.
 */
export function isTaskOverdue(task: Pick<TaskDto, 'status' | 'dueDate'>, today: Date = new Date()): boolean {
  return task.status !== TaskStatus.Done && daysBetween(today, parseDateOnly(task.dueDate)) < 0;
}
