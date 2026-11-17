import type { TaskDto } from '../dto/task.dto';
import { TaskStatus } from '../dto/enum.dto';
import { daysBetween, parseDateOnly } from './date.utils';

/**
 * A task is overdue when its due day is before today and it isn't done.
 * Computed on the fly because the API's `isOverdue` goes stale.
 */
export function isTaskOverdue(task: Pick<TaskDto, 'status' | 'dueDate'>, today: Date = new Date()): boolean {
  return task.status !== TaskStatus.Done && daysBetween(today, parseDateOnly(task.dueDate)) < 0;
}

/**
 * `completedAt` after a status change: stamped when a task becomes done,
 * cleared when it leaves done, unchanged otherwise.
 */
export function completedAtFor(
  task: Pick<TaskDto, 'status' | 'completedAt'>,
  nextStatus: TaskStatus,
  nowIso: string
): string | null {
  if (nextStatus === task.status) return task.completedAt ?? null;
  return nextStatus === TaskStatus.Done ? nowIso : null;
}

/** Case-insensitive match on title, description and tags. */
export function matchesSearch(task: Pick<TaskDto, 'title' | 'description' | 'tags'>, search: string): boolean {
  const term: string = search.trim().toLowerCase();
  if (!term) return true;
  return (
    task.title.toLowerCase().includes(term) ||
    task.description.toLowerCase().includes(term) ||
    task.tags.some((tag: string) => tag.toLowerCase().includes(term))
  );
}
