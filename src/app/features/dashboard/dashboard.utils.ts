import { CreateTaskDto, Identifiable, TaskDto, TaskPriority, TaskStatus, UpdateTaskDto, UserDto } from '../../core/dto';
import { daysBetween, parseDateOnly } from '../../core/utils';
import {
  PositionUpdate,
  TaskFilters,
  TaskFormValue,
  TaskStats,
  TaskUpdate,
  UpdateTaskContext,
} from './dashboard.model';

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (Object.values(TaskStatus) as unknown[]).includes(value);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (Object.values(TaskPriority) as unknown[]).includes(value);
}

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

export const POSITION_GAP: number = 1000;

type Sortable = Pick<TaskDto, 'id' | 'position'>;
type Positioned = Pick<TaskDto, 'position'>;

export function positionBetween(before: number | null, after: number | null): number | null {
  if (after === null) return (before ?? 0) + POSITION_GAP;

  const low: number = before ?? 0;
  const mid: number = Math.floor((low + after) / 2);
  return mid > low && mid < after ? mid : null;
}

export function rebalance(items: readonly Identifiable[]): PositionUpdate[] {
  return items.map((item: Identifiable, index: number) => ({ id: item.id, position: (index + 1) * POSITION_GAP }));
}

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

export function positionAfterLast(items: readonly Positioned[]): number {
  const last: number = items.reduce((max: number, item: Positioned) => Math.max(max, item.position), 0);
  return last + POSITION_GAP;
}

export function byPosition<T extends Positioned>(items: readonly T[]): T[] {
  return [...items].sort((a: T, b: T) => a.position - b.position);
}

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
