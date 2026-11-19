import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TaskDto, TaskPriority, TaskStatus } from '@core/dto';
import { flushActivities, flushInitialLoad, makeTask, NotificationsMock, storeTestProviders } from '@testing';

import { BoardColumn } from '../dashboard.model';
import { BoardStateService } from './board-state.service';
import { DashboardTasksStateService } from './dashboard-tasks-state.service';

const { Todo, InProgress, Done } = TaskStatus;

describe('BoardStateService', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let board: BoardStateService;
  let http: HttpTestingController;

  async function load(tasks: TaskDto[]): Promise<void> {
    board = TestBed.inject(BoardStateService);
    await flushInitialLoad(http, tasks);
  }

  const columnIds = (status: TaskStatus): string[] =>
    board
      .columns()
      .find((c: BoardColumn) => c.status === status)!
      .tasks.map((t: TaskDto) => t.id);

  const filteredIds = (): string[] => board.filteredTasks().map((t: TaskDto) => t.id);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: storeTestProviders(notifications) });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('filters', () => {
    beforeEach(async () => {
      await load([
        makeTask('a', Todo, 1000, { title: 'Design page', priority: TaskPriority.High }),
        makeTask('b', Todo, 2000, { title: 'Write tests' }),
      ]);
    });

    it('filters by search and priority, and resets', () => {
      expect(board.isFiltered()).toBe(false);
      board.setFilters({ search: 'design' });
      expect(filteredIds()).toEqual(['a']);
      board.setFilters({ search: '', priority: TaskPriority.Medium });
      expect(filteredIds()).toEqual(['b']);
      expect(board.isFiltered()).toBe(true);
      board.resetFilters();
      expect(filteredIds()).toEqual(['a', 'b']);
    });
  });

  describe('columns', () => {
    it('shows the three fixed columns with tasks sorted by position', async () => {
      await load([makeTask('b', Todo, 2000), makeTask('a', Todo, 1000), makeTask('c', Done, 1000)]);
      expect(board.columns().map((c: BoardColumn) => c.status)).toEqual([Todo, InProgress, Done]);
      expect(columnIds(Todo)).toEqual(['a', 'b']);
    });

    it('columns follow the filters; the status filter limits visible columns', async () => {
      await load([makeTask('a', Todo, 1000, { priority: TaskPriority.High }), makeTask('b', Todo, 2000)]);
      board.setFilters({ priority: TaskPriority.High, status: Todo });
      expect(columnIds(Todo)).toEqual(['a']);
      expect(board.visibleColumns().map((c: BoardColumn) => c.status)).toEqual([Todo]);
    });
  });

  it('maps a drop in a filtered column to the full column', async () => {
    await load([
      makeTask('a', Todo, 1000, { title: 'hidden' }),
      makeTask('b', Todo, 2000, { title: 'shown' }),
      makeTask('c', Todo, 3000, { title: 'hidden' }),
      makeTask('d', InProgress, 1000, { title: 'shown' }),
    ]);
    board.setFilters({ search: 'shown' });
    const done: Promise<boolean> = board.moveTask('d', Todo, 1);

    http.expectOne('/api/tasks/d').flush({});
    expect(await done).toBe(true);
    flushActivities(http);
    board.resetFilters();
    expect(
      TestBed.inject(DashboardTasksStateService)
        .column(Todo)
        .map((t: TaskDto) => t.id)
    ).toEqual(['a', 'b', 'd', 'c']);
  });
});
