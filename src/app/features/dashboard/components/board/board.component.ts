import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, OnInit, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';

import { TaskDto } from '../../../../core/dto';
import { NotificationService } from '../../../../core/services/notification.service';
import { UsersStore } from '../../../../core/services/store';
import { ErrorStateComponent } from '../../../../shared';
import { TaskFilters, TaskFormValue, TaskMoveRequest } from '../../dashboard.model';
import { isTaskPriority, isTaskStatus } from '../../dashboard.utils';
import { BoardStateService } from '../../services/board-state.service';
import { DashboardTasksStateService } from '../../services/dashboard-tasks-state.service';
import { BoardColumnComponent } from '../board-column/board-column.component';
import { BoardFiltersComponent } from '../board-filters/board-filters.component';
import { StatusFilter } from '../board-filters/board-filters.model';
import { BoardTaskFormDialogComponent } from '../board-task-form-dialog/board-task-form-dialog.component';
import { DashboardSkeletonComponent } from '../dashboard-skeleton/dashboard-skeleton.component';
import { CARD_MENU_LABEL_KEYS } from './board.config';

@Component({
  selector: 'app-board',
  imports: [
    CdkDropListGroup,
    ConfirmDialogModule,
    ErrorStateComponent,
    DashboardSkeletonComponent,
    BoardFiltersComponent,
    BoardColumnComponent,
    BoardTaskFormDialogComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './board.component.html',
})
export class BoardComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly confirmation: ConfirmationService = inject(ConfirmationService);
  private readonly notifications: NotificationService = inject(NotificationService);

  protected readonly board: BoardStateService = inject(BoardStateService);
  protected readonly tasks: DashboardTasksStateService = inject(DashboardTasksStateService);
  protected readonly users: UsersStore = inject(UsersStore);

  protected readonly menuLabels: Signal<Record<string, string>> = toSignal(
    this.translate.stream(CARD_MENU_LABEL_KEYS),
    { initialValue: {} }
  );

  private readonly queryParams: Signal<ParamMap> = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly taskParam: Signal<string | null> = computed(() => this.queryParams().get('task'));
  protected readonly editingTask: Signal<TaskDto | null> = computed(() => {
    const id: string | null = this.taskParam();
    return id && id !== 'new' ? (this.tasks.find(id) ?? null) : null;
  });
  protected readonly dialogOpen: Signal<boolean> = computed(
    () => this.taskParam() === 'new' || this.editingTask() !== null
  );
  protected readonly saving: WritableSignal<boolean> = signal<boolean>(false);

  protected readonly statusFilter: Signal<StatusFilter> = computed(() => this.board.filters().status ?? 'all');
  protected readonly isFirstLoad: Signal<boolean> = computed(
    () => this.tasks.isLoading() && !this.tasks.tasks().length
  );

  constructor() {
    effect(() => {
      const id: string | null = this.taskParam();
      if (!id || id === 'new' || this.tasks.isLoading() || this.tasks.error() || this.editingTask()) return;
      untracked(() => {
        this.notifications.error('errors.notFound');
        this.closeTask();
      });
    });

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

  protected closeTask(): void {
    void this.router.navigate([], { queryParams: { task: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected async saveTask(value: TaskFormValue): Promise<void> {
    const editing: TaskDto | null = this.editingTask();
    this.saving.set(true);
    const ok: boolean = editing ? await this.tasks.update(editing.id, value) : await this.tasks.create(value);
    this.saving.set(false);
    if (ok) this.closeTask();
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
