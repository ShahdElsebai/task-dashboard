import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef, DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { provideTranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';

import { CommentDto, TaskDto, TaskPriority, TaskStatus } from '@core/dto';
import { CommentsStore } from '@core/services/store';
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

  async function open(url: string, comments: CommentDto[] = []): Promise<HTMLElement> {
    harness = await RouterTestingHarness.create();
    const navigation: Promise<unknown> = harness.navigateByUrl(url, DashboardComponent);
    const responses: Record<string, unknown> = {
      '/api/tasks': TASKS,
      '/api/users': [TEST_USER],
      '/api/activities?_sort=-timestamp': [],
      '/api/statistics': [],
      '/api/comments?_sort=createdAt': comments,
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

  it('follows the URL when it changes later (Back/Forward, sidebar link, Team page link)', async () => {
    await open('/dashboard?priority=high&assignee=user-001');
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(BoardStateService).filters()).toMatchObject({ priority: null, assigneeId: null });

    await harness.navigateByUrl('/dashboard?status=done');
    expect(TestBed.inject(BoardStateService).filters().status).toBe(TaskStatus.Done);
    expect(TestBed.inject(Router).url).toBe('/dashboard?status=done');
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

  describe('comments in the task dialog', () => {
    const dialog = (): DebugElement => harness.routeDebugElement!.query(By.directive(BoardTaskFormDialogComponent));
    const COMMENTS: CommentDto[] = [
      {
        id: 'c1',
        taskId: 'b',
        taskTitle: 'Task b',
        author: TEST_USER,
        body: 'On it',
        mentions: [],
        createdAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'c2',
        taskId: 'a',
        taskTitle: 'Task a',
        author: TEST_USER,
        body: 'Other task',
        mentions: [],
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ];
    const textarea = (): HTMLTextAreaElement => document.querySelector<HTMLTextAreaElement>('#task-comment-input')!;
    const type = async (value: string): Promise<void> => {
      textarea().value = value;
      textarea().dispatchEvent(new Event('input'));
      await TestBed.inject(ApplicationRef).whenStable();
    };
    const postButton = (): HTMLButtonElement =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('app-board-task-comments button')).at(-1)!;

    it("shows only the open task's comments, and none when creating", async () => {
      await open('/dashboard?task=b', COMMENTS);
      const items: string[] = Array.from(document.querySelectorAll('app-board-task-comments li')).map(
        (li: Element) => li.textContent!
      );
      expect(items).toHaveLength(1);
      expect(items[0]).toContain('On it');

      await harness.navigateByUrl('/dashboard?task=new');
      harness.detectChanges();
      expect(document.querySelector('app-board-task-comments')).toBeNull();
    });

    it('posts as the current user with the mentions, keeping the draft until it is saved', async () => {
      await open('/dashboard?task=b');
      const add: ReturnType<typeof vi.spyOn> = vi
        .spyOn(TestBed.inject(CommentsStore), 'add')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await type(`Thanks @${TEST_USER.name}`);
      postButton().click();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(add).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), `Thanks @${TEST_USER.name}`, [
        TEST_USER.id,
      ]);
      expect(textarea().value).toBe(`Thanks @${TEST_USER.name}`);

      postButton().click();
      await TestBed.inject(ApplicationRef).whenStable();
      harness.detectChanges();
      expect(add).toHaveBeenCalledTimes(2);
      expect(textarea().value).toBe('');
    });

    it('asks before closing with an unsent comment', async () => {
      await open('/dashboard?task=b');
      await type('Half-written');
      const confirmation: ConfirmationService = dialog().injector.get(ConfirmationService);
      const confirm: ReturnType<typeof vi.spyOn> = vi.spyOn(confirmation, 'confirm');

      (dialog().componentInstance as unknown as { requestClose: () => void }).requestClose();
      expect(confirm).toHaveBeenCalled();
      expect(TestBed.inject(Router).url).toContain('task=b');
    });
  });
});
