import { Service, type Signal, computed, inject } from '@angular/core';

import { BOARD_COLUMNS, type BoardColumnConfig } from '../../config/board.config';
import type { TaskDto, TaskStatus } from '../../dto';
import type { BoardColumn, TaskStats } from '../../models';
import { byPosition, computeStats, toFullIndex } from '../../utils';
import { TaskFiltersStore } from './task-filters.store';
import { TasksStore } from './tasks.store';

@Service()
export class BoardStore {
  private readonly tasks: TasksStore = inject(TasksStore);
  private readonly filters: TaskFiltersStore = inject(TaskFiltersStore);

  readonly columns: Signal<BoardColumn[]> = computed(() => {
    const visible: TaskDto[] = this.filters.filteredTasks();
    return BOARD_COLUMNS.map((column: BoardColumnConfig) => ({
      ...column,
      tasks: byPosition(visible.filter((task: TaskDto) => task.status === column.status)),
    }));
  });

  readonly stats: Signal<TaskStats> = computed(() => computeStats(this.tasks.tasks()));

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
