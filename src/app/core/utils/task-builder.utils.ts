import { TaskStatus } from '../dto/enum.dto';
import type { CreateTaskDto, TaskDto, UpdateTaskDto } from '../dto/task.dto';
import type { UserDto } from '../dto/user.dto';
import type { TaskFilters } from '../models/task-filters.model';
import type { TaskFormValue } from '../models/task-form.model';
import type { TaskStats } from '../models/board.model';
import { type PositionUpdate, planMove } from './position.utils';
import { completedAtFor, isTaskOverdue, matchesSearch } from './task.utils';

export interface TaskUpdate {
  id: string;
  changes: UpdateTaskDto;
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

export interface UpdateTaskContext {
  /** The new assignee, when `changes.assigneeId` differs from the current one. */
  assignee?: UserDto;
  /** Position at the bottom of the new status column, used when the status changes. */
  endPosition: (status: TaskStatus) => number;
  now?: string;
}

/**
 * Builds a PATCH body with only the fields that changed.
 * A status change also sets/clears `completedAt` and moves the task to the
 * bottom of its new column.
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
 * PATCH bodies for a drag-and-drop move.
 * Usually one entry (the moved task gets the midpoint between its new
 * neighbours). Only when the gap is used up do neighbours get new positions too.
 *
 * @param columnTasks All tasks of the target column, sorted by position.
 * @param index       Target index in that column, after the move.
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
