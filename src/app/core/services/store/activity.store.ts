import { HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { ACTIVITY_LIMIT } from '../../config/activity.config';
import { ActivityDto, ActivityType, CreateActivityDto, TaskDto } from '../../dto';
import { replaceById, tempId, valueOr } from '../../utils';
import { ActivitiesApiService } from '../api';

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

  log(type: ActivityType, task: TaskDto): void {
    const entry: CreateActivityDto = {
      type,
      taskId: task.id,
      taskTitle: task.title,
      user: task.assignee,
      timestamp: new Date().toISOString(),
    };
    const id: string = tempId();
    this.mutate((items: ActivityDto[]) => [{ ...entry, id }, ...items]);
    firstValueFrom(this.api.create(entry))
      .then((saved: ActivityDto) => this.mutate((items: ActivityDto[]) => replaceById(items, id, saved)))
      .catch(() => undefined);
  }

  private mutate(fn: (items: ActivityDto[]) => ActivityDto[]): void {
    this.resource.value.set(fn(valueOr(this.resource, [])));
  }
}
