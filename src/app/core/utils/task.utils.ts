import type { TaskDto } from '../dto/task.dto';
import { TaskStatus } from '../dto/enum.dto';
import { daysBetween, parseDateOnly } from './date.utils';

// Computed on the fly: the API's isOverdue goes stale.
export function isTaskOverdue(task: Pick<TaskDto, 'status' | 'dueDate'>, today: Date = new Date()): boolean {
  return task.status !== TaskStatus.Done && daysBetween(today, parseDateOnly(task.dueDate)) < 0;
}

export function completedAtFor(
  task: Pick<TaskDto, 'status' | 'completedAt'>,
  nextStatus: TaskStatus,
  nowIso: string
): string | null {
  if (nextStatus === task.status) return task.completedAt ?? null;
  return nextStatus === TaskStatus.Done ? nowIso : null;
}

export function matchesSearch(task: Pick<TaskDto, 'title' | 'description' | 'tags'>, search: string): boolean {
  const term: string = search.trim().toLowerCase();
  if (!term) return true;
  return (
    task.title.toLowerCase().includes(term) ||
    task.description.toLowerCase().includes(term) ||
    task.tags.some((tag: string) => tag.toLowerCase().includes(term))
  );
}
