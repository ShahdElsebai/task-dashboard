import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TaskDto, TaskStatus } from '@core/dto';
import { flushInitialLoad, makeTask, NotificationsMock, storeTestProviders } from '@testing';

import { DashboardStateService } from './dashboard-state.service';

const { Todo, InProgress } = TaskStatus;

describe('DashboardStateService', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let dashboard: DashboardStateService;
  let http: HttpTestingController;

  async function load(tasks: TaskDto[]): Promise<void> {
    dashboard = TestBed.inject(DashboardStateService);
    await flushInitialLoad(http, tasks);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: storeTestProviders(notifications) });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('stats', () => {
    it('count all tasks', async () => {
      await load([makeTask('a', Todo, 1000, { dueDate: '2000-01-01' }), makeTask('b', InProgress, 1000)]);
      expect(dashboard.stats()).toEqual({ total: 2, todo: 1, inProgress: 1, completed: 0, overdue: 1 });
    });

    it('stat cards use live numbers even when /statistics has no metadata', async () => {
      await load([makeTask('a', Todo, 1000)]);
      expect(dashboard.statCards().map((c: { value: number }) => c.value)).toEqual([1, 0, 0, 0]);
    });
  });
});
