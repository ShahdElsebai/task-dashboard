import { HttpResourceRef } from '@angular/common/http';
import { Service, Signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ActivityDto, ActivityType, CreateActivityDto, TaskDto } from '../../dto';
import { replaceById, tempId } from '../../utils';
import { ActivitiesApiService } from '../api';

export const ACTIVITY_LIMIT: number = 20;

@Service()
export class ActivityStore {
  private readonly api: ActivitiesApiService = inject(ActivitiesApiService);
  private readonly resource: HttpResourceRef<ActivityDto[]> = this.api.listResource();

  readonly activities: Signal<ActivityDto[]> = computed(() => this.resource.value().slice(0, ACTIVITY_LIMIT));
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);

  reload(): void {
    this.resource.reload();
  }

  // Non-critical feed: a failed save is ignored, no toast or rollback.
  log(type: ActivityType, task: TaskDto): void {
    const entry: CreateActivityDto = {
      type,
      taskId: task.id,
      taskTitle: task.title,
      user: task.assignee,
      timestamp: new Date().toISOString(),
    };
    const id: string = tempId();
    this.resource.value.update((items: ActivityDto[]) => [{ ...entry, id }, ...items]);
    firstValueFrom(this.api.create(entry))
      .then((saved: ActivityDto) => this.resource.value.update((items: ActivityDto[]) => replaceById(items, id, saved)))
      .catch(() => undefined);
  }
}
