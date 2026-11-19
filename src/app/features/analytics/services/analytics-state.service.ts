import { HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal } from '@angular/core';

import { ActivityDto, TaskDto } from '@core/dto';
import { ActivityStore } from '@core/services/store';
import { valueOr } from '@core/utils';

import { FEED_SIZE } from '../analytics.config';
import { ChartSlice } from '../analytics.model';
import { prioritySlices, statusSlices } from '../analytics.utils';
import { AnalyticsApiService } from './analytics-api.service';

/**
 * Provided by the page component, not in root: each visit creates a new resource, so the page
 * reflects changes made on the board since the last visit (the HTTP cache is cleared by writes).
 */
@Service({ autoProvided: false })
export class AnalyticsStateService {
  private readonly activity: ActivityStore = inject(ActivityStore);
  private readonly resource: HttpResourceRef<TaskDto[]> = inject(AnalyticsApiService).tasksResource();

  readonly tasks: Signal<TaskDto[]> = computed(() => valueOr(this.resource, []));
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);
  readonly total: Signal<number> = computed(() => this.tasks().length);

  readonly byStatus: Signal<ChartSlice[]> = computed(() => statusSlices(this.tasks()));
  readonly byPriority: Signal<ChartSlice[]> = computed(() => prioritySlices(this.tasks()));

  readonly activities: Signal<ActivityDto[]> = computed(() => this.activity.activities().slice(0, FEED_SIZE));
  readonly activitiesLoading: Signal<boolean> = this.activity.isLoading;
  readonly activitiesError: Signal<unknown> = this.activity.error;

  reload(): void {
    this.resource.reload();
  }

  reloadActivities(): void {
    this.activity.reload();
  }
}
