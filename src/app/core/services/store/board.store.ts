import { Service, type Signal, computed, inject } from '@angular/core';

import { BOARD_COLUMNS, type BoardColumnConfig } from '../../config/board.config';
import type { TaskDto, TaskStatus } from '../../dto';
import type { BoardColumn, TaskStats } from '../../models';
import { byPosition, computeStats, toFullIndex } from '../../utils';
import { TaskFiltersStore } from './task-filters.store';
import { TasksStore } from './tasks.store';

/** What the board screen renders: fixed status columns and the stat cards. */
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

  /** From all tasks, so filters don't change the cards. */
  readonly stats: Signal<TaskStats> = computed(() => computeStats(this.tasks.tasks()));

  /**
   * Handles a drop from the board. `visibleIndex` is where the user dropped
   * among the tasks they can see; filters may hide some, so it is mapped to
   * the full column first and hidden tasks keep their order.
   */
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
