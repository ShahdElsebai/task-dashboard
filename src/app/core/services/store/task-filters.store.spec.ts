import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TaskPriority, TaskStatus, type TaskDto } from '../../dto';
import { type NotificationsMock, flushInitialLoad, makeTask, storeTestProviders } from './store.test-helpers';
import { TaskFiltersStore } from './task-filters.store';

describe('TaskFiltersStore', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let filters: TaskFiltersStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: storeTestProviders(notifications) });
    filters = TestBed.inject(TaskFiltersStore);
    await flushInitialLoad(TestBed.inject(HttpTestingController), [
      makeTask('a', TaskStatus.Todo, 1000, { title: 'Design page', priority: TaskPriority.High }),
      makeTask('b', TaskStatus.Todo, 2000, { title: 'Write tests' }),
    ]);
  });

  const ids = (): string[] => filters.filteredTasks().map((t: TaskDto) => t.id);

  it('filters by search and priority, and resets', () => {
    expect(filters.isActive()).toBe(false);
    filters.set({ search: 'design' });
    expect(ids()).toEqual(['a']);
    filters.set({ search: '', priority: TaskPriority.Medium });
    expect(ids()).toEqual(['b']);
    expect(filters.isActive()).toBe(true);
    filters.reset();
    expect(ids()).toEqual(['a', 'b']);
  });
});
