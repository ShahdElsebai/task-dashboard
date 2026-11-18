import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, OnInit, Signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';

import { TaskDto } from '../../../../core/dto';
import { UsersStore } from '../../../../core/services/store';
import { ErrorStateComponent } from '../../../../shared';
import { BOARD_COLUMNS } from '../../dashboard.config';
import { BoardColumnConfig, TaskFilters, TaskMoveRequest } from '../../dashboard.model';
import { isTaskPriority, isTaskStatus } from '../../dashboard.utils';
import { BoardStateService } from '../../services/board-state.service';
import { DashboardTasksStateService } from '../../services/dashboard-tasks-state.service';
import { BoardColumnComponent } from '../board-column/board-column.component';
import { BoardFiltersComponent } from '../board-filters/board-filters.component';
import { StatusFilter } from '../board-filters/board-filters.model';
import { DashboardSkeletonComponent } from '../dashboard-skeleton/dashboard-skeleton.component';

const CARD_MENU_LABEL_KEYS: string[] = [
  'tasks.edit',
  'tasks.delete',
  'tasks.moveTo',
  ...BOARD_COLUMNS.map((c: BoardColumnConfig) => c.titleKey),
];

@Component({
  selector: 'app-board',
  imports: [
    CdkDropListGroup,
    ConfirmDialogModule,
    ErrorStateComponent,
    DashboardSkeletonComponent,
    BoardFiltersComponent,
    BoardColumnComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './board.component.html',
})
export class BoardComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly confirmation: ConfirmationService = inject(ConfirmationService);

  protected readonly board: BoardStateService = inject(BoardStateService);
  protected readonly tasks: DashboardTasksStateService = inject(DashboardTasksStateService);
  protected readonly users: UsersStore = inject(UsersStore);

  protected readonly menuLabels: Signal<Record<string, string>> = toSignal(
    this.translate.stream(CARD_MENU_LABEL_KEYS),
    { initialValue: {} }
  );

  protected readonly statusFilter: Signal<StatusFilter> = computed(() => this.board.filters().status ?? 'all');
  protected readonly isFirstLoad: Signal<boolean> = computed(
    () => this.tasks.isLoading() && !this.tasks.tasks().length
  );

  constructor() {
    effect(() => {
      const f: TaskFilters = this.board.filters();
      untracked(() =>
        this.router.navigate([], {
          queryParams: { status: f.status, priority: f.priority, assignee: f.assigneeId, q: f.search || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
      );
    });
  }

  ngOnInit(): void {
    const params: ParamMap = this.route.snapshot.queryParamMap;
    const status: string | null = params.get('status');
    const priority: string | null = params.get('priority');
    this.board.setFilters({
      status: isTaskStatus(status) ? status : null,
      priority: isTaskPriority(priority) ? priority : null,
      assigneeId: params.get('assignee'),
      search: params.get('q') ?? '',
    });
  }

  protected onStatusChange(value: StatusFilter): void {
    this.board.setFilters({ status: value === 'all' ? null : value });
  }

  protected onMove(request: TaskMoveRequest): void {
    void this.board.moveTask(request.taskId, request.toStatus, request.index);
  }

  protected openTask(id: string): void {
    void this.router.navigate([], { queryParams: { task: id }, queryParamsHandling: 'merge' });
  }

  protected confirmDelete(task: TaskDto): void {
    this.confirmation.confirm({
      header: this.translate.instant('tasks.deleteTitle'),
      message: this.translate.instant('tasks.deleteMessage', { title: task.title }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('tasks.delete'),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => void this.tasks.delete(task.id),
    });
  }
}
