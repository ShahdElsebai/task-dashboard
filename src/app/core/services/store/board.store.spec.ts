import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TaskPriority, TaskStatus, type TaskDto } from '../../dto';
import type { BoardColumn } from '../../models';
import { BoardStore } from './board.store';
import {
  type NotificationsMock,
  flushActivities,
  flushInitialLoad,
  makeTask,
  storeTestProviders,
} from './store.test-helpers';
import { TaskFiltersStore } from './task-filters.store';
import { TasksStore } from './tasks.store';

const { Todo, InProgress, Done } = TaskStatus;

describe('BoardStore', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let board: BoardStore;
  let filters: TaskFiltersStore;
  let http: HttpTestingController;

  async function load(tasks: TaskDto[]): Promise<void> {
    board = TestBed.inject(BoardStore);
    filters = TestBed.inject(TaskFiltersStore);
    await flushInitialLoad(http, tasks);
  }

  const columnIds = (status: TaskStatus): string[] =>
    board
      .columns()
      .find((c: BoardColumn) => c.status === status)!
      .tasks.map((t: TaskDto) => t.id);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: storeTestProviders(notifications) });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the three fixed columns with tasks sorted by position', async () => {
    await load([makeTask('b', Todo, 2000), makeTask('a', Todo, 1000), makeTask('c', Done, 1000)]);
    expect(board.columns().map((c: BoardColumn) => c.status)).toEqual([Todo, InProgress, Done]);
    expect(columnIds(Todo)).toEqual(['a', 'b']);
  });

  it('columns follow the filters', async () => {
    await load([makeTask('a', Todo, 1000, { priority: TaskPriority.High }), makeTask('b', Todo, 2000)]);
    filters.set({ priority: TaskPriority.High });
    expect(columnIds(Todo)).toEqual(['a']);
  });

  it('stats ignore the filters', async () => {
    await load([makeTask('a', Todo, 1000, { dueDate: '2000-01-01' }), makeTask('b', InProgress, 1000)]);
    filters.set({ search: 'nothing matches' });
    expect(board.stats()).toEqual({ total: 2, todo: 1, inProgress: 1, completed: 0, overdue: 1 });
  });

  it('maps a drop in a filtered column to the full column', async () => {
    await load([
      makeTask('a', Todo, 1000, { title: 'hidden' }),
      makeTask('b', Todo, 2000, { title: 'shown' }),
      makeTask('c', Todo, 3000, { title: 'hidden' }),
      makeTask('d', InProgress, 1000, { title: 'shown' }),
    ]);
    filters.set({ search: 'shown' });
    const done: Promise<boolean> = board.moveTask('d', Todo, 1); // after b, the only visible task

    http.expectOne('/api/tasks/d').flush({});
    expect(await done).toBe(true);
    flushActivities(http);
    filters.reset();
    expect(
      TestBed.inject(TasksStore)
        .column(Todo)
        .map((t: TaskDto) => t.id)
    ).toEqual(['a', 'b', 'd', 'c']);
  });
});
