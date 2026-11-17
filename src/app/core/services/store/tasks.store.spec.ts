import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TaskPriority, TaskStatus, TaskDto } from '../../dto';
import { TaskFormValue } from '../../models';
import {
  NotificationsMock,
  flushActivities,
  flushInitialLoad,
  makeTask,
  storeTestProviders,
} from './store.test-helpers';
import { TasksStore } from './tasks.store';
import { UsersStore } from './users.store';

const { Todo, InProgress, Done } = TaskStatus;

const form: TaskFormValue = {
  title: '  New  ',
  description: '',
  status: InProgress,
  priority: TaskPriority.High,
  dueDate: '2099-01-01',
  assigneeId: 'user-1',
  tags: [' UI ', ''],
};

describe('TasksStore', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let store: TasksStore;
  let http: HttpTestingController;

  async function load(tasks: TaskDto[]): Promise<void> {
    store = TestBed.inject(TasksStore);
    TestBed.inject(UsersStore);
    await flushInitialLoad(http, tasks);
  }

  const ids = (status: TaskStatus): string[] => store.column(status).map((t: TaskDto) => t.id);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: storeTestProviders(notifications) });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('adds optimistically at the bottom of its column, then swaps in the saved task', async () => {
      await load([makeTask('a', InProgress, 1000)]);
      const done: Promise<boolean> = store.create(form);

      expect(store.tasks()).toHaveLength(2);
      const req: TestRequest = http.expectOne('/api/tasks');
      expect(req.request.body).toMatchObject({ title: 'New', status: 'in_progress', position: 2000, tags: ['UI'] });
      req.flush({ ...req.request.body, id: 'task-new' });

      expect(await done).toBe(true);
      flushActivities(http);
      expect(ids(InProgress)).toEqual(['a', 'task-new']);
    });

    it('removes the optimistic task on failure', async () => {
      await load([]);
      const done: Promise<boolean> = store.create(form);
      http.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
      expect(await done).toBe(false);
      expect(store.tasks()).toEqual([]);
    });
  });

  it('update with a new status moves the task to the bottom of that column', async () => {
    await load([makeTask('a', Todo, 1000), makeTask('d', Done, 1000)]);
    const done: Promise<boolean> = store.update('a', { status: Done });
    const req: TestRequest = http.expectOne('/api/tasks/a');
    expect(req.request.body).toMatchObject({ status: 'done', position: 2000 });
    req.flush(makeTask('a', Done, 2000));
    expect(await done).toBe(true);
    flushActivities(http);
  });

  it('delete restores the task on failure', async () => {
    await load([makeTask('a', Todo, 1000)]);
    const done: Promise<boolean> = store.delete('a');
    expect(store.tasks()).toEqual([]);
    http.expectOne('/api/tasks/a').flush(null, { status: 500, statusText: 'Error' });
    expect(await done).toBe(false);
    expect(ids(Todo)).toEqual(['a']);
  });

  describe('move', () => {
    it('reorders within a column with one PATCH at the midpoint', async () => {
      await load([makeTask('a', Todo, 1000), makeTask('b', Todo, 2000), makeTask('c', Todo, 3000)]);
      const done: Promise<boolean> = store.move('c', Todo, 1);

      const req: TestRequest = http.expectOne('/api/tasks/c');
      expect(req.request.body).toMatchObject({ position: 1500, status: 'todo' });
      expect(ids(Todo)).toEqual(['a', 'c', 'b']);
      req.flush({});
      expect(await done).toBe(true);
    });

    it('moving to another column changes status and stamps completedAt', async () => {
      await load([makeTask('a', Todo, 1000), makeTask('d', Done, 1000)]);
      const done: Promise<boolean> = store.move('a', Done, 1);

      const req: TestRequest = http.expectOne('/api/tasks/a');
      expect(req.request.body).toMatchObject({ status: 'done', position: 2000, completedAt: expect.any(String) });
      req.flush({});
      expect(await done).toBe(true);
      flushActivities(http);
    });

    it('rebalances only when the gap is used up', async () => {
      await load([makeTask('a', Todo, 1000), makeTask('b', Todo, 1001), makeTask('c', InProgress, 1000)]);
      const done: Promise<boolean> = store.move('c', Todo, 1);

      const reqs: TestRequest[] = http.match((r: { url: string }) => r.url.startsWith('/api/tasks/'));
      expect(reqs.map((r: TestRequest) => [r.request.url, r.request.body.position])).toEqual([
        ['/api/tasks/c', 2000],
        ['/api/tasks/b', 3000],
      ]);
      reqs.forEach((r: TestRequest) => r.flush({}));
      expect(await done).toBe(true);
      flushActivities(http);
    });

    it('does nothing when dropped back in place', async () => {
      await load([makeTask('a', Todo, 1000), makeTask('b', Todo, 2000)]);
      expect(await store.move('a', Todo, 0)).toBe(true);
      http.expectNone('/api/tasks/a');
    });

    it('rolls back on failure', async () => {
      await load([makeTask('a', Todo, 1000), makeTask('b', Todo, 2000)]);
      const done: Promise<boolean> = store.move('b', Todo, 0);
      http.expectOne('/api/tasks/b').flush(null, { status: 500, statusText: 'Error' });
      expect(await done).toBe(false);
      expect(ids(Todo)).toEqual(['a', 'b']);
    });
  });
});
