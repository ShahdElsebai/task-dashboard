import { TaskDto, TaskStatus } from '../dto';
import { daysBetween, parseDateOnly } from './date.utils';

export function isTaskOverdue(task: Pick<TaskDto, 'status' | 'dueDate'>, today: Date = new Date()): boolean {
  return task.status !== TaskStatus.Done && daysBetween(today, parseDateOnly(task.dueDate)) < 0;
}
