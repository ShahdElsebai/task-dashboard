import { Component, computed, inject, Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';

import { ErrorStateComponent } from '../../shared';
import { AnalyticsActivityFeedComponent } from './components/analytics-activity-feed/analytics-activity-feed.component';
import { AnalyticsChartCardComponent } from './components/analytics-chart-card/analytics-chart-card.component';
import { AnalyticsStateService } from './services/analytics-state.service';

@Component({
  selector: 'app-analytics',
  imports: [
    TranslatePipe,
    SkeletonModule,
    ErrorStateComponent,
    AnalyticsChartCardComponent,
    AnalyticsActivityFeedComponent,
  ],
  providers: [AnalyticsStateService],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent {
  protected readonly state: AnalyticsStateService = inject(AnalyticsStateService);

  protected readonly chartsLoading: Signal<boolean> = computed(
    () => this.state.isLoading() && !this.state.tasks().length
  );
  protected readonly activityLoading: Signal<boolean> = computed(
    () => this.state.activitiesLoading() && !this.state.activities().length
  );
}
