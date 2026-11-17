import { Service, type Signal, type WritableSignal, computed, inject, signal } from '@angular/core';

import type { TaskDto } from '../../dto';
import { EMPTY_FILTERS, type TaskFilters } from '../../models';
import { filterTasks, hasActiveFilters } from '../../utils';
import { TasksStore } from './tasks.store';

@Service()
export class TaskFiltersStore {
  private readonly tasks: TasksStore = inject(TasksStore);

  readonly filters: WritableSignal<TaskFilters> = signal<TaskFilters>(EMPTY_FILTERS);
  readonly isActive: Signal<boolean> = computed(() => hasActiveFilters(this.filters()));
  readonly filteredTasks: Signal<TaskDto[]> = computed(() => filterTasks(this.tasks.tasks(), this.filters()));

  set(changes: Partial<TaskFilters>): void {
    this.filters.update((current: TaskFilters) => ({ ...current, ...changes }));
  }

  reset(): void {
    this.filters.set(EMPTY_FILTERS);
  }
}
