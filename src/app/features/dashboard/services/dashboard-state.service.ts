import { HttpResourceRef } from '@angular/common/http';
import { Service, Signal, computed, inject } from '@angular/core';

import { ChangeType, StatisticDto } from '../../../core/dto';
import { STAT_CARDS } from '../components/dashboard-stat-card/dashboard-stat-card.config';
import { StatCardConfig, StatCardView } from '../components/dashboard-stat-card/dashboard-stat-card.model';
import { TaskStats } from '../dashboard.model';
import { computeStats } from '../dashboard.utils';
import { DashboardApiService } from './dashboard-api.service';
import { DashboardTasksStateService } from './dashboard-tasks-state.service';

@Service()
export class DashboardStateService {
  private readonly tasks: DashboardTasksStateService = inject(DashboardTasksStateService);
  private readonly statistics: HttpResourceRef<StatisticDto[]> = inject(DashboardApiService).statisticsResource();

  readonly stats: Signal<TaskStats> = computed(() => computeStats(this.tasks.tasks()));

  readonly statCards: Signal<StatCardView[]> = computed(() => {
    const stats: TaskStats = this.stats();
    const meta: StatisticDto[] = this.statistics.value();
    return STAT_CARDS.map((card: StatCardConfig) => {
      const m: StatisticDto | undefined = meta.find((s: StatisticDto) => s.id === card.id);
      return {
        id: card.id,
        titleKey: card.titleKey,
        value: stats[card.stat],
        icon: m?.icon ?? 'pi pi-chart-bar',
        iconClass: card.iconClass,
        change: m?.change ?? '0',
        changeLabel: m?.changeLabel ?? '',
        changeType: m?.changeType ?? ChangeType.Neutral,
      };
    });
  });

  reload(): void {
    this.tasks.reload();
    this.statistics.reload();
  }
}
