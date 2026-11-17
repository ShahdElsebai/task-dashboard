import type { HttpResourceRef } from '@angular/common/http';
import { Service, type Signal, computed, inject } from '@angular/core';
import { type Observable, firstValueFrom, forkJoin } from 'rxjs';

import {
  ActivityType,
  type CreateTaskDto,
  TaskStatus,
  type TaskDto,
  type UpdateTaskDto,
  type UserDto,
} from '../../dto';
import type { TaskFormValue } from '../../models';
import {
  type TaskUpdate,
  buildCreateTaskDto,
  buildUpdateTaskDto,
  byPosition,
  patchById,
  planTaskMove,
  positionAfterLast,
  removeById,
  replaceById,
  restoreById,
  tempId,
} from '../../utils';
import { TasksApiService } from '../api';
import { NotificationService } from '../notification.service';
import { ActivityStore } from './activity.store';
import { UsersStore } from './users.store';

/**
 * Owns the task data and every write to it. Knows nothing about filters or the UI.
 *
 * Writes are optimistic: the resource value changes first, then the request
 * runs; on failure only the affected tasks are rolled back
 * (errorInterceptor has already shown the toast).
 */
@Service()
export class TasksStore {
  private readonly api: TasksApiService = inject(TasksApiService);
  private readonly users: UsersStore = inject(UsersStore);
  private readonly activity: ActivityStore = inject(ActivityStore);
  private readonly notifications: NotificationService = inject(NotificationService);
  private readonly resource: HttpResourceRef<TaskDto[]> = this.api.listResource();

  readonly tasks: Signal<TaskDto[]> = computed(() => this.resource.value());
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);

  reload(): void {
    this.resource.reload();
  }

  find(id: string): TaskDto | undefined {
    return this.tasks().find((task: TaskDto) => task.id === id);
  }

  /** Tasks of one status column, sorted by position. */
  column(status: TaskStatus): TaskDto[] {
    return byPosition(this.tasks().filter((task: TaskDto) => task.status === status));
  }

  async create(form: TaskFormValue): Promise<boolean> {
    const assignee: UserDto | undefined = this.users.find(form.assigneeId);
    if (!assignee) {
      this.notifications.error('errors.validation');
      return false;
    }

    const body: CreateTaskDto = buildCreateTaskDto(form, assignee, positionAfterLast(this.column(form.status)));
    const id: string = tempId();
    this.resource.value.update((tasks: TaskDto[]) => [...tasks, { ...body, id }]);

    try {
      const saved: TaskDto = await firstValueFrom(this.api.create(body));
      this.resource.value.update((tasks: TaskDto[]) => replaceById(tasks, id, saved));
      this.activity.log(ActivityType.Created, saved);
      this.notifications.success('notifications.taskCreated');
      return true;
    } catch {
      this.resource.value.update((tasks: TaskDto[]) => removeById(tasks, id));
      return false;
    }
  }

  async update(id: string, changes: Partial<TaskFormValue>): Promise<boolean> {
    const current: TaskDto | undefined = this.find(id);
    if (!current) return false;

    const dto: UpdateTaskDto = buildUpdateTaskDto(current, changes, {
      assignee: changes.assigneeId ? this.users.find(changes.assigneeId) : undefined,
      endPosition: (status: TaskStatus) => positionAfterLast(this.column(status)),
    });

    this.apply([{ id, changes: dto }]);
    try {
      const saved: TaskDto = await firstValueFrom(this.api.update(id, dto));
      this.resource.value.update((tasks: TaskDto[]) => replaceById(tasks, id, saved));
      this.activity.log(activityFor(current.status, saved.status), saved);
      this.notifications.success('notifications.taskUpdated');
      return true;
    } catch {
      this.rollback([current]);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    const current: TaskDto | undefined = this.find(id);
    if (!current) return false;

    this.resource.value.update((tasks: TaskDto[]) => removeById(tasks, id));
    try {
      await firstValueFrom(this.api.delete(id));
      this.activity.log(ActivityType.Deleted, current);
      this.notifications.success('notifications.taskDeleted');
      return true;
    } catch {
      this.rollback([current]);
      return false;
    }
  }

  /**
   * Moves a task to `index` in the `toStatus` column (index in the full column,
   * not a filtered view: BoardStore does that mapping). Usually one PATCH.
   */
  async move(taskId: string, toStatus: TaskStatus, index: number): Promise<boolean> {
    const task: TaskDto | undefined = this.find(taskId);
    if (!task) return false;

    const target: TaskDto[] = this.column(toStatus);
    if (task.status === toStatus && target.findIndex((t: TaskDto) => t.id === taskId) === index) return true;

    const updates: TaskUpdate[] = planTaskMove(task, target, toStatus, index);
    const previous: TaskDto[] = updates.map((u: TaskUpdate) => this.find(u.id)).filter(isDefined);
    this.apply(updates);

    try {
      await firstValueFrom(
        forkJoin(updates.map((u: TaskUpdate): Observable<TaskDto> => this.api.update(u.id, u.changes)))
      );
      if (task.status !== toStatus)
        this.activity.log(activityFor(task.status, toStatus), { ...task, status: toStatus });
      return true;
    } catch {
      this.rollback(previous);
      return false;
    }
  }

  private apply(updates: readonly TaskUpdate[]): void {
    const changes: Map<string, Partial<TaskDto>> = new Map<string, Partial<TaskDto>>(
      updates.map((u: TaskUpdate) => [u.id, u.changes])
    );
    this.resource.value.update((tasks: TaskDto[]) => patchById<TaskDto>(tasks, changes));
  }

  private rollback(previous: readonly TaskDto[]): void {
    this.resource.value.update((tasks: TaskDto[]) => restoreById(tasks, previous));
  }
}

function activityFor(from: TaskStatus, to: TaskStatus): ActivityType {
  if (from === to) return ActivityType.Updated;
  return to === TaskStatus.Done ? ActivityType.Completed : ActivityType.StatusChanged;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
