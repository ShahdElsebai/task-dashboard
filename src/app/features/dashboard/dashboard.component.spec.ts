import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef, DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideTranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';

import { TaskDto, TaskPriority, TaskStatus } from '@core/dto';
import { makeTask, NotificationsMock, storeTestProviders, TEST_USER } from '@testing';

import { BoardComponent } from './components/board/board.component';
import { BoardTaskFormDialogComponent } from './components/board-task-form-dialog/board-task-form-dialog.component';
import { DashboardComponent } from './dashboard.component';
import { TaskFormValue } from './dashboard.model';
import { BoardStateService } from './services/board-state.service';
import { DashboardTasksStateService } from './services/dashboard-tasks-state.service';

const TASKS: TaskDto[] = [
  makeTask('a', TaskStatus.Todo, 1000, { priority: TaskPriority.High }),
  makeTask('b', TaskStatus.InProgress, 1000),
  makeTask('c', TaskStatus.Done, 1000),
];

describe('DashboardComponent', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  async function open(url: string): Promise<HTMLElement> {
    harness = await RouterTestingHarness.create();
    const navigation: Promise<unknown> = harness.navigateByUrl(url, DashboardComponent);
    const responses: Record<string, unknown> = {
      '/api/tasks': TASKS,
      '/api/users': [TEST_USER],
      '/api/activities?_sort=-timestamp': [],
      '/api/statistics': [],
    };
    for (let i: number = 0; i < 20 && Object.keys(responses).length; i++) {
      await new Promise<void>((resolve: () => void) => setTimeout(resolve));
      for (const [url, body] of Object.entries(responses)) {
        const pending: TestRequest[] = http.match(url);
        pending.forEach((r: TestRequest) => r.flush(body as object));
        if (pending.length) delete responses[url];
      }
    }
    await navigation;
    await TestBed.inject(ApplicationRef).whenStable();
    harness.detectChanges();
    return harness.routeNativeElement!;
  }

  const columnTitles = (host: HTMLElement): string[] =>
    Array.from(host.querySelectorAll('app-board-column h2')).map((h: Element) => h.textContent!.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...storeTestProviders(notifications),
        provideRouter([{ path: 'dashboard', component: DashboardComponent }], withComponentInputBinding()),
        provideTranslateService(),
        MessageService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('renders the four stat cards from live task numbers and three columns', async () => {
    const host: HTMLElement = await open('/dashboard');
    const cards: string[] = Array.from(host.querySelectorAll('app-dashboard-stat-card')).map(
      (c: Element) => c.textContent!
    );
    expect(cards).toHaveLength(4);
    expect(cards[0]).toContain('3');
    expect(columnTitles(host)).toEqual(['board.columns.todo', 'board.columns.inProgress', 'board.columns.done']);
  });

  it('applies filters from the URL on load and shows only the filtered column', async () => {
    const host: HTMLElement = await open('/dashboard?status=todo&priority=high&q=task');
    expect(TestBed.inject(BoardStateService).filters()).toMatchObject({
      status: TaskStatus.Todo,
      priority: TaskPriority.High,
      search: 'task',
    });
    expect(columnTitles(host)).toEqual(['board.columns.todo']);
  });

  it('ignores unknown filter values in the URL', async () => {
    await open('/dashboard?status=bogus&priority=urgent');
    expect(TestBed.inject(BoardStateService).filters()).toMatchObject({ status: null, priority: null });
  });

  it('writes filter changes back to the URL', async () => {
    await open('/dashboard');
    TestBed.inject(BoardStateService).setFilters({ status: TaskStatus.Done });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(TestBed.inject(Router).url).toContain('status=done');
  });

  it('asks for confirmation before deleting', async () => {
    const host: HTMLElement = await open('/dashboard');
    const board: DebugElement = harness.routeDebugElement!.query(By.directive(BoardComponent));
    const confirm: ReturnType<typeof vi.spyOn> = vi.spyOn(board.injector.get(ConfirmationService), 'confirm');
    const remove: ReturnType<typeof vi.spyOn> = vi
      .spyOn(TestBed.inject(DashboardTasksStateService), 'delete')
      .mockResolvedValue(true);

    (board.componentInstance as { confirmDelete: (t: TaskDto) => void }).confirmDelete(TASKS[0]);
    expect(confirm).toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();

    (confirm.mock.calls[0][0] as { accept: () => void }).accept();
    expect(remove).toHaveBeenCalledWith('a');
    expect(host).toBeTruthy();
  });

  describe('task dialog (driven by ?task=)', () => {
    const dialog = (): DebugElement => harness.routeDebugElement!.query(By.directive(BoardTaskFormDialogComponent));
    const board = (): { saveTask: (v: TaskFormValue) => Promise<void> } =>
      harness.routeDebugElement!.query(By.directive(BoardComponent)).componentInstance as {
        saveTask: (v: TaskFormValue) => Promise<void>;
      };
    const formValue: TaskFormValue = {
      title: 'New one',
      description: '',
      status: TaskStatus.Todo,
      priority: TaskPriority.Low,
      dueDate: '2099-01-01',
      assigneeId: TEST_USER.id,
      tags: [],
    };

    it('opens empty for ?task=new', async () => {
      await open('/dashboard?task=new');
      const instance: BoardTaskFormDialogComponent = dialog().componentInstance as BoardTaskFormDialogComponent;
      expect(instance.open()).toBe(true);
      expect(instance.task()).toBeNull();
    });

    it('opens with the task for ?task=<id>', async () => {
      await open('/dashboard?task=b');
      const instance: BoardTaskFormDialogComponent = dialog().componentInstance as BoardTaskFormDialogComponent;
      expect(instance.open()).toBe(true);
      expect(instance.task()?.id).toBe('b');
    });

    it('reports an unknown id and clears it from the URL', async () => {
      await open('/dashboard?task=missing');
      await TestBed.inject(ApplicationRef).whenStable();
      expect(notifications.error).toHaveBeenCalledWith('errors.notFound');
      expect(TestBed.inject(Router).url).not.toContain('task=');
    });

    it('closes after a successful save and stays open when it fails', async () => {
      await open('/dashboard?task=new');
      const create: ReturnType<typeof vi.spyOn> = vi
        .spyOn(TestBed.inject(DashboardTasksStateService), 'create')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await board().saveTask(formValue);
      await TestBed.inject(ApplicationRef).whenStable();
      expect(TestBed.inject(Router).url).toContain('task=new');

      await board().saveTask(formValue);
      await TestBed.inject(ApplicationRef).whenStable();
      expect(create).toHaveBeenCalledTimes(2);
      expect(TestBed.inject(Router).url).not.toContain('task=');
    });

    it('updates when editing', async () => {
      await open('/dashboard?task=b');
      const update: ReturnType<typeof vi.spyOn> = vi
        .spyOn(TestBed.inject(DashboardTasksStateService), 'update')
        .mockResolvedValue(true);
      await board().saveTask(formValue);
      expect(update).toHaveBeenCalledWith('b', formValue);
    });
  });
});
