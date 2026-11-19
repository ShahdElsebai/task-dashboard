import { ParamMap, Params } from '@angular/router';

import { CreateTaskDto, Identifiable, TaskDto, TaskPriority, TaskStatus, UpdateTaskDto, UserDto } from '@core/dto';
import { isTaskOverdue } from '@core/utils';

import { POSITION_GAP } from './dashboard.config';
import {
  Positioned,
  PositionUpdate,
  Sortable,
  TaskFilters,
  TaskFormValue,
  TaskStats,
  TaskUpdate,
  UpdateTaskContext,
} from './dashboard.model';

/** Type guard for values that come from outside the app (URL, API). */
export function isTaskStatus(value: unknown): value is TaskStatus {
  return (Object.values(TaskStatus) as unknown[]).includes(value);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (Object.values(TaskPriority) as unknown[]).includes(value);
}

/**
 * The `completedAt` a task should have after a status change.
 *
 * @param task The task before the change.
 * @param nextStatus The status it is moving to.
 * @param nowIso The current time, as an ISO string.
 * @return Its existing value if the status doesn't change, `nowIso` when it becomes done,
 *     and null when it leaves done.
 */
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

/**
 * A position strictly between two neighbours, used to place a moved task without touching others.
 *
 * Positions start `POSITION_GAP` apart (1000, 2000, 3000 …), so a move usually needs one update:
 * the midpoint of its new neighbours. Repeated moves into the same spot halve the gap each time,
 * until no whole number is left between the neighbours.
 *
 * @param before Position of the task above, or null at the top of the column.
 * @param after Position of the task below, or null at the bottom.
 * @return The new position, or null when there is no room and the column must be rebalanced.
 */
export function positionBetween(before: number | null, after: number | null): number | null {
  if (after === null) return (before ?? 0) + POSITION_GAP;

  const low: number = before ?? 0;
  const mid: number = Math.floor((low + after) / 2);
  return mid > low && mid < after ? mid : null;
}

/**
 * Spreads tasks out again as 1000, 2000, 3000 … in the given order.
 *
 * @param items The column's tasks, already in their new order.
 * @return One update per task.
 */
export function rebalance(items: readonly Identifiable[]): PositionUpdate[] {
  return items.map((item: Identifiable, index: number) => ({ id: item.id, position: (index + 1) * POSITION_GAP }));
}

/**
 * Plans the position updates for moving one task to an index within a column.
 *
 * Normally a single update (the midpoint between the new neighbours). When the neighbours are
 * adjacent integers there is no midpoint, so the column is rebalanced, and only the tasks whose
 * position actually changes are returned, which keeps the number of PATCH requests minimal.
 *
 * @param siblings All tasks of the target column (may include the moved task).
 * @param movedId The task being moved.
 * @param toIndex Where it should end up, counted without the moved task. Clamped to the column.
 * @return The updates to apply; never empty.
 */
export function planMove(siblings: readonly Sortable[], movedId: string, toIndex: number): PositionUpdate[] {
  const others: Sortable[] = siblings.filter((item: Sortable) => item.id !== movedId);
  const index: number = Math.max(0, Math.min(toIndex, others.length));
  const before: number | null = index > 0 ? others[index - 1].position : null;
  const after: number | null = index < others.length ? others[index].position : null;

  const position: number | null = positionBetween(before, after);
  if (position !== null) return [{ id: movedId, position }];

  const ordered: Identifiable[] = [...others.slice(0, index), { id: movedId }, ...others.slice(index)];
  const current: Map<string, number> = new Map<string, number>(
    siblings.map((item: Sortable) => [item.id, item.position])
  );
  return rebalance(ordered).filter((update: PositionUpdate) => current.get(update.id) !== update.position);
}

/** Position for a task added at the bottom of a column. */
export function positionAfterLast(items: readonly Positioned[]): number {
  const last: number = items.reduce((max: number, item: Positioned) => Math.max(max, item.position), 0);
  return last + POSITION_GAP;
}

export function byPosition<T extends Positioned>(items: readonly T[]): T[] {
  return [...items].sort((a: T, b: T) => a.position - b.position);
}

/**
 * Converts a drop index among the visible (filtered) tasks into an index in the full column.
 *
 * Filters can hide tasks, so the index the user dropped at doesn't match the column the
 * position must be computed from. The task is placed just before the visible task it was
 * dropped above, so hidden tasks keep their relative order. For example, with A, B, C in a
 * column and B hidden, dropping D between A and C gives A, B, D, C.
 *
 * @param full The whole column, without the moved task.
 * @param visible The tasks the user sees in that column, without the moved task.
 * @param visibleIndex The drop index among `visible`.
 * @return The index to use with {@link planMove}.
 */
export function toFullIndex(
  full: readonly Identifiable[],
  visible: readonly Identifiable[],
  visibleIndex: number
): number {
  if (visible.length === 0) return full.length;
  const ids: string[] = full.map((item: Identifiable) => item.id);
  if (visibleIndex < visible.length) {
    const at: number = ids.indexOf(visible[Math.max(0, visibleIndex)].id);
    return at === -1 ? full.length : at;
  }
  const last: number = ids.indexOf(visible[visible.length - 1].id);
  return last === -1 ? full.length : last + 1;
}

function cleanTags(tags: readonly string[]): string[] {
  return tags.map((tag: string) => tag.trim()).filter(Boolean);
}

/**
 * Builds the POST body for a new task: trims text, drops empty tags and sets the timestamps.
 *
 * @param form The form value.
 * @param assignee The full user object (the API stores it embedded in the task).
 * @param position Where the task goes in its column, usually the bottom.
 * @param now The current time, injectable for tests.
 * @return The request body.
 */
export function buildCreateTaskDto(
  form: TaskFormValue,
  assignee: UserDto,
  position: number,
  now: string = new Date().toISOString()
): CreateTaskDto {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate,
    completedAt: form.status === TaskStatus.Done ? now : null,
    assignee,
    position,
    tags: cleanTags(form.tags),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Builds a PATCH body containing only what changed.
 *
 * A status change also sets `completedAt` and moves the task to the bottom of its new column,
 * since its old position means nothing there.
 *
 * @param current The task as it is now.
 * @param changes The edited fields.
 * @param context The resolved assignee, a way to get the end position of a column, and the time.
 * @return The request body.
 */
export function buildUpdateTaskDto(
  current: TaskDto,
  changes: Partial<TaskFormValue>,
  context: UpdateTaskContext
): UpdateTaskDto {
  const now: string = context.now ?? new Date().toISOString();
  const dto: UpdateTaskDto = { updatedAt: now };

  if (changes.title !== undefined) dto.title = changes.title.trim();
  if (changes.description !== undefined) dto.description = changes.description.trim();
  if (changes.priority !== undefined) dto.priority = changes.priority;
  if (changes.dueDate !== undefined) dto.dueDate = changes.dueDate;
  if (changes.tags !== undefined) dto.tags = cleanTags(changes.tags);
  if (context.assignee && context.assignee.id !== current.assignee.id) dto.assignee = context.assignee;

  if (changes.status !== undefined && changes.status !== current.status) {
    dto.status = changes.status;
    dto.completedAt = completedAtFor(current, changes.status, now);
    dto.position = context.endPosition(changes.status);
  }
  return dto;
}

/**
 * Turns a board move (drag and drop or the card menu) into PATCH requests.
 *
 * @param task The task being moved.
 * @param columnTasks The target column's tasks.
 * @param toStatus The target column.
 * @param index The index in the full column, see {@link toFullIndex}.
 * @param now The current time, injectable for tests.
 * @return The moved task's update (position, status, `completedAt`) plus any rebalanced neighbours.
 */
export function planTaskMove(
  task: TaskDto,
  columnTasks: readonly TaskDto[],
  toStatus: TaskStatus,
  index: number,
  now: string = new Date().toISOString()
): TaskUpdate[] {
  return planMove(columnTasks, task.id, index).map((update: PositionUpdate) =>
    update.id === task.id
      ? {
          id: task.id,
          changes: {
            position: update.position,
            status: toStatus,
            completedAt: completedAtFor(task, toStatus, now),
            updatedAt: now,
          },
        }
      : { id: update.id, changes: { position: update.position } }
  );
}

export function filterTasks(tasks: readonly TaskDto[], filters: TaskFilters): TaskDto[] {
  return tasks.filter(
    (task: TaskDto) =>
      (filters.status === null || task.status === filters.status) &&
      (filters.priority === null || task.priority === filters.priority) &&
      (filters.assigneeId === null || task.assignee.id === filters.assigneeId) &&
      matchesSearch(task, filters.search)
  );
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== '' || filters.status !== null || filters.priority !== null || filters.assigneeId !== null
  );
}

/**
 * The numbers for the stat cards, computed from the tasks rather than taken from `/statistics`,
 * which would go stale after the first change.
 */
export function computeStats(tasks: readonly TaskDto[], today: Date = new Date()): TaskStats {
  const stats: TaskStats = { total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 };
  for (const task of tasks) {
    stats.total++;
    if (task.status === TaskStatus.Todo) stats.todo++;
    if (task.status === TaskStatus.InProgress) stats.inProgress++;
    if (task.status === TaskStatus.Done) stats.completed++;
    if (isTaskOverdue(task, today)) stats.overdue++;
  }
  return stats;
}

/**
 * Reads the board filters from the URL (`?status=todo&priority=high&assignee=user-001&q=design`).
 *
 * @param params The current query params.
 * @return The filters. Unknown status or priority values are dropped rather than trusted.
 */
export function filtersFromQueryParams(params: ParamMap): TaskFilters {
  const status: string | null = params.get('status');
  const priority: string | null = params.get('priority');
  return {
    status: isTaskStatus(status) ? status : null,
    priority: isTaskPriority(priority) ? priority : null,
    assigneeId: params.get('assignee'),
    search: params.get('q') ?? '',
  };
}

/** The filters as query params; empty filters become null so the router drops them from the URL. */
export function filtersToQueryParams(filters: TaskFilters): Params {
  return {
    status: filters.status,
    priority: filters.priority,
    assignee: filters.assigneeId,
    q: filters.search || null,
  };
}

export function sameFilters(a: TaskFilters, b: TaskFilters): boolean {
  return a.status === b.status && a.priority === b.priority && a.assigneeId === b.assigneeId && a.search === b.search;
}
