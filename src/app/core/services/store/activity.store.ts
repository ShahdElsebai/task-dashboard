import { HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { ACTIVITY_LIMIT } from '../../config/activity.config';
import { ActivityDto, ActivityType, CreateActivityDto, TaskDto, UserDto } from '../../dto';
import { replaceById, tempId, valueOr } from '../../utils';
import { ActivitiesApiService } from '../api';

/** The recent activity feed, shared by the dashboard and the Analytics page. */
@Service()
export class ActivityStore {
  private readonly api: ActivitiesApiService = inject(ActivitiesApiService);
  private readonly resource: HttpResourceRef<ActivityDto[]> = this.api.listResource();

  readonly activities: Signal<ActivityDto[]> = computed(() => valueOr(this.resource, []).slice(0, ACTIVITY_LIMIT));
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);

  reload(): void {
    this.resource.reload();
  }

  /**
   * Records something that happened to a task.
   *
   * The entry appears in the feed immediately with a temporary id, then is swapped for the
   * saved one. A failure is ignored: the task change itself already succeeded, and a missing
   * feed entry isn't worth an error toast.
   *
   * @param type What happened.
   * @param task The task it happened to, as it is now.
   * @param user Who did it. Defaults to the assignee, as in the seed data.
   */
  log(type: ActivityType, task: TaskDto, user: UserDto = task.assignee): void {
    const entry: CreateActivityDto = {
      type,
      taskId: task.id,
      taskTitle: task.title,
      user,
      timestamp: new Date().toISOString(),
    };
    const id: string = tempId();
    this.mutate((items: ActivityDto[]) => [{ ...entry, id }, ...items]);
    firstValueFrom(this.api.create(entry))
      .then((saved: ActivityDto) => this.mutate((items: ActivityDto[]) => replaceById(items, id, saved)))
      .catch(() => undefined);
  }

  /** Like `resource.value.update`, but also works after a failed load (where reading the value throws). */
  private mutate(fn: (items: ActivityDto[]) => ActivityDto[]): void {
    this.resource.value.set(fn(valueOr(this.resource, [])));
  }
}
