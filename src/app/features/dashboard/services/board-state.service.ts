import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';

import { TaskDto, TaskStatus } from '@core/dto';
import { SearchService } from '@core/services/search.service';

import { BOARD_COLUMNS, EMPTY_FIELD_FILTERS } from '../dashboard.config';
import { BoardColumn, BoardColumnConfig, TaskFieldFilters, TaskFilters } from '../dashboard.model';
import { byPosition, filterTasks, hasActiveFilters, toFullIndex } from '../dashboard.utils';
import { DashboardTasksStateService } from './dashboard-tasks-state.service';

@Service()
export class BoardStateService {
  private readonly tasks: DashboardTasksStateService = inject(DashboardTasksStateService);
  private readonly search: SearchService = inject(SearchService);
  private readonly fieldFilters: WritableSignal<TaskFieldFilters> = signal<TaskFieldFilters>(EMPTY_FIELD_FILTERS);

  readonly filters: Signal<TaskFilters> = computed(() => ({ ...this.fieldFilters(), search: this.search.query() }));
  readonly isFiltered: Signal<boolean> = computed(() => hasActiveFilters(this.filters()));
  readonly filteredTasks: Signal<TaskDto[]> = computed(() => filterTasks(this.tasks.tasks(), this.filters()));

  setFilters(changes: Partial<TaskFilters>): void {
    const { search, ...fields }: Partial<TaskFilters> = changes;
    if (search !== undefined) this.search.set(search);
    if (Object.keys(fields).length)
      this.fieldFilters.update((current: TaskFieldFilters) => ({ ...current, ...fields }));
  }

  resetFilters(): void {
    this.fieldFilters.set(EMPTY_FIELD_FILTERS);
    this.search.set('');
  }

  readonly columns: Signal<BoardColumn[]> = computed(() => {
    const visible: TaskDto[] = this.filteredTasks();
    return BOARD_COLUMNS.map((column: BoardColumnConfig) => ({
      ...column,
      tasks: byPosition(visible.filter((task: TaskDto) => task.status === column.status)),
    }));
  });

  readonly visibleColumns: Signal<BoardColumn[]> = computed(() => {
    const status: TaskStatus | null = this.filters().status;
    return this.columns().filter((column: BoardColumn) => status === null || column.status === status);
  });

  moveTask(taskId: string, toStatus: TaskStatus, visibleIndex: number): Promise<boolean> {
    const withoutMoved: (list: TaskDto[]) => TaskDto[] = (list: TaskDto[]): TaskDto[] =>
      list.filter((task: TaskDto) => task.id !== taskId);
    const full: TaskDto[] = withoutMoved(this.tasks.column(toStatus));
    const visible: TaskDto[] = withoutMoved(
      this.columns().find((column: BoardColumn) => column.status === toStatus)?.tasks ?? []
    );
    return this.tasks.move(taskId, toStatus, toFullIndex(full, visible, visibleIndex));
  }
}
