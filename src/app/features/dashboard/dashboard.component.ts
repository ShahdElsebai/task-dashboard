import { Component, computed, inject, Signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { BoardComponent } from './components/board/board.component';
import { DashboardSkeletonComponent } from './components/dashboard-skeleton/dashboard-skeleton.component';
import { DashboardStatCardComponent } from './components/dashboard-stat-card/dashboard-stat-card.component';
import { DashboardStateService } from './services/dashboard-state.service';
import { DashboardTasksStateService } from './services/dashboard-tasks-state.service';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, DashboardSkeletonComponent, DashboardStatCardComponent, BoardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly tasks: DashboardTasksStateService = inject(DashboardTasksStateService);
  protected readonly dashboard: DashboardStateService = inject(DashboardStateService);

  protected readonly isFirstLoad: Signal<boolean> = computed(
    () => this.tasks.isLoading() && !this.tasks.tasks().length
  );
}
