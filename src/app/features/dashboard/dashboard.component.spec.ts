import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef, DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';

import { TaskPriority, TaskStatus, TaskDto } from '../../core/dto';
import { BoardStateService } from './services/board-state.service';
import { DashboardTasksStateService } from './services/dashboard-tasks-state.service';
import { NotificationsMock, TEST_USER, makeTask, storeTestProviders } from './services/dashboard.test-helpers';
import { BoardComponent } from './components/board/board.component';
import { DashboardComponent } from './dashboard.component';

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
});
