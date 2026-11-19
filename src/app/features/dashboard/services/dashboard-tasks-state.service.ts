import { HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal } from '@angular/core';

import { firstValueFrom, forkJoin, Observable } from 'rxjs';

import { ActivityType, CreateTaskDto, TaskDto, TaskStatus, UpdateTaskDto, UserDto } from '@core/dto';
import { NotificationService } from '@core/services/notification.service';
import { ActivityStore, UsersStore } from '@core/services/store';
import { patchById, removeById, replaceById, restoreById, tempId, valueOr } from '@core/utils';

import { TaskFormValue, TaskUpdate } from '../dashboard.model';
import {
  buildCreateTaskDto,
  buildUpdateTaskDto,
  byPosition,
  planTaskMove,
  positionAfterLast,
} from '../dashboard.utils';
import { DashboardApiService } from './dashboard-api.service';

/**
 * The board's task data and every write to it.
 *
 * All writes are optimistic: the change shows immediately, then is confirmed by the server or
 * rolled back if the request fails (the error interceptor shows the toast). Methods resolve to
 * true on success so callers, like the task dialog, can decide whether to close.
 */
@Service()
export class DashboardTasksStateService {
  private readonly api: DashboardApiService = inject(DashboardApiService);
  private readonly users: UsersStore = inject(UsersStore);
  private readonly activity: ActivityStore = inject(ActivityStore);
  private readonly notifications: NotificationService = inject(NotificationService);
  private readonly resource: HttpResourceRef<TaskDto[]> = this.api.tasksResource();

  readonly tasks: Signal<TaskDto[]> = computed(() => valueOr(this.resource, []));
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);

  reload(): void {
    this.resource.reload();
  }

  find(id: string): TaskDto | undefined {
    return this.tasks().find((task: TaskDto) => task.id === id);
  }

  /** A column's tasks in board order. */
  column(status: TaskStatus): TaskDto[] {
    return byPosition(this.tasks().filter((task: TaskDto) => task.status === status));
  }

  /**
   * Adds a task at the bottom of its column.
   *
   * @param form The form value.
   * @return True once saved; false if the assignee is unknown or the request failed.
   */
  async create(form: TaskFormValue): Promise<boolean> {
    const assignee: UserDto | undefined = this.users.find(form.assigneeId);
    if (!assignee) {
      this.notifications.error('errors.validation');
      return false;
    }

    const body: CreateTaskDto = buildCreateTaskDto(form, assignee, positionAfterLast(this.column(form.status)));
    const id: string = tempId();
    this.mutate((tasks: TaskDto[]) => [...tasks, { ...body, id }]);

    try {
      const saved: TaskDto = await firstValueFrom(this.api.createTask(body));
      this.mutate((tasks: TaskDto[]) => replaceById(tasks, id, saved));
      this.activity.log(ActivityType.Created, saved);
      this.notifications.success('notifications.taskCreated');
      return true;
    } catch {
      this.mutate((tasks: TaskDto[]) => removeById(tasks, id));
      return false;
    }
  }

  /**
   * Saves edited fields. A status change also moves the task to the bottom of its new column.
   *
   * @param id The task to update.
   * @param changes The edited fields.
   * @return True once saved; false if the task is gone or the request failed.
   */
  async update(id: string, changes: Partial<TaskFormValue>): Promise<boolean> {
    const current: TaskDto | undefined = this.find(id);
    if (!current) return false;

    const dto: UpdateTaskDto = buildUpdateTaskDto(current, changes, {
      assignee: changes.assigneeId ? this.users.find(changes.assigneeId) : undefined,
      endPosition: (status: TaskStatus) => positionAfterLast(this.column(status)),
    });

    this.apply([{ id, changes: dto }]);
    try {
      const saved: TaskDto = await firstValueFrom(this.api.updateTask(id, dto));
      this.mutate((tasks: TaskDto[]) => replaceById(tasks, id, saved));
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

    this.mutate((tasks: TaskDto[]) => removeById(tasks, id));
    try {
      await firstValueFrom(this.api.deleteTask(id));
      this.activity.log(ActivityType.Deleted, current);
      this.notifications.success('notifications.taskDeleted');
      return true;
    } catch {
      this.rollback([current]);
      return false;
    }
  }

  /**
   * Moves a task to a column and position (drag and drop, or the card menu).
   *
   * Usually one PATCH for the moved task. If the column has to be rebalanced, the neighbours
   * whose position changes are patched too, in parallel, and all of them are rolled back if
   * any request fails.
   *
   * @param taskId The task to move.
   * @param toStatus The target column.
   * @param index The index in the full target column, counted without the moved task.
   * @return True once saved (or when nothing had to change).
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
        forkJoin(updates.map((u: TaskUpdate): Observable<TaskDto> => this.api.updateTask(u.id, u.changes)))
      );
      if (task.status !== toStatus)
        this.activity.log(activityFor(task.status, toStatus), { ...task, status: toStatus });
      return true;
    } catch {
      this.rollback(previous);
      return false;
    }
  }

  /** Like `resource.value.update`, but also works after a failed load (where reading the value throws). */
  private mutate(fn: (tasks: TaskDto[]) => TaskDto[]): void {
    this.resource.value.set(fn(this.tasks()));
  }

  private apply(updates: readonly TaskUpdate[]): void {
    const changes: Map<string, Partial<TaskDto>> = new Map<string, Partial<TaskDto>>(
      updates.map((u: TaskUpdate) => [u.id, u.changes])
    );
    this.mutate((tasks: TaskDto[]) => patchById<TaskDto>(tasks, changes));
  }

  private rollback(previous: readonly TaskDto[]): void {
    this.mutate((tasks: TaskDto[]) => restoreById(tasks, previous));
  }
}

/** Which activity to log for a status change. */
function activityFor(from: TaskStatus, to: TaskStatus): ActivityType {
  if (from === to) return ActivityType.Updated;
  return to === TaskStatus.Done ? ActivityType.Completed : ActivityType.StatusChanged;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
