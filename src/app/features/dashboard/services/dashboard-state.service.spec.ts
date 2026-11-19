import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TaskDto, TaskStatus } from '@core/dto';
import { flushInitialLoad, makeTask, NotificationsMock, storeTestProviders } from '@testing';

import { StatCardView } from '../components/dashboard-stat-card/dashboard-stat-card.model';
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
      expect(dashboard.statCards().map((c: StatCardView) => c.value)).toEqual([1, 0, 0, 0]);
    });
  });

  describe('with custom responses', () => {
    async function respond(
      tasks: TaskDto[] | 'error',
      statistics: unknown[],
      activities: unknown[] = []
    ): Promise<void> {
      dashboard = TestBed.inject(DashboardStateService);
      TestBed.tick();
      const tasksReq: TestRequest = http.expectOne('/api/tasks');
      if (tasks === 'error') tasksReq.flush('down', { status: 500, statusText: 'Error' });
      else tasksReq.flush(tasks);
      http.match('/api/statistics').forEach((r: TestRequest) => r.flush(statistics));
      http.match('/api/users').forEach((r: TestRequest) => r.flush([]));
      http.match('/api/activities?_sort=-timestamp').forEach((r: TestRequest) => r.flush(activities));
      await TestBed.inject(ApplicationRef).whenStable();
    }

    it('maps known change labels to translation keys and keeps unknown ones', async () => {
      await respond(
        [],
        [
          { id: 'stat-001', icon: 'pi pi-x', change: '+1', changeLabel: 'this week', changeType: 'positive' },
          { id: 'stat-002', icon: 'pi pi-x', change: '+1', changeLabel: 'since Monday', changeType: 'positive' },
        ]
      );
      const labels: string[] = dashboard.statCards().map((c: StatCardView) => c.changeLabel);
      expect(labels.slice(0, 2)).toEqual(['stats.change.thisWeek', 'since Monday']);
    });

    it('shows no numbers (null) when the tasks failed to load', async () => {
      await respond('error', []);
      expect(dashboard.statCards().map((c: StatCardView) => c.value)).toEqual([null, null, null, null]);
    });
  });
});
