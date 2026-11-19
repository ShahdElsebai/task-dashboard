import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { interval, map } from 'rxjs';

import { ActivityDto } from '@core/dto';
import { LanguageService } from '@core/services/language.service';

import { ACTIVITY_FEED_REFRESH_MS } from './analytics-activity-feed.config';
import { ActivityItem } from './analytics-activity-feed.model';
import { toActivityItem } from './analytics-activity-feed.utils';

@Component({
  selector: 'app-analytics-activity-feed',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './analytics-activity-feed.component.html',
})
export class AnalyticsActivityFeedComponent {
  private readonly language: LanguageService = inject(LanguageService);

  readonly activities: InputSignal<ActivityDto[]> = input.required<ActivityDto[]>();

  private readonly now: Signal<Date> = toSignal(interval(ACTIVITY_FEED_REFRESH_MS).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });

  protected readonly items: Signal<ActivityItem[]> = computed(() => {
    const now: Date = this.now();
    const locale: string = this.language.current();
    return this.activities().map((a: ActivityDto) => toActivityItem(a, now, locale));
  });
}
