import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { makeTask, NotificationsMock, storeTestProviders, TEST_USER } from '@testing';

import { MENTIONS_SEEN_STORAGE_KEY } from '../../config/comment.config';
import { CURRENT_USER } from '../../config/user.config';
import { CommentDto, TaskStatus, UserDto } from '../../dto';
import { CommentsStore } from './comments.store';

const OTHER: UserDto = { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 's@x.com' };

function comment(id: string, overrides: Partial<CommentDto> = {}): CommentDto {
  return {
    id,
    taskId: 'a',
    taskTitle: 'Task a',
    author: OTHER,
    body: 'Hello',
    mentions: [],
    createdAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('CommentsStore', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let store: CommentsStore;
  let http: HttpTestingController;

  async function load(comments: CommentDto[]): Promise<void> {
    store = TestBed.inject(CommentsStore);
    TestBed.tick();
    http.expectOne('/api/comments?_sort=createdAt').flush(comments);
    http.match('/api/activities?_sort=-timestamp').forEach((r: TestRequest) => r.flush([]));
    await TestBed.inject(ApplicationRef).whenStable();
  }

  beforeEach(() => {
    localStorage.removeItem(MENTIONS_SEEN_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: storeTestProviders(notifications) });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.clearAllMocks();
  });

  it("lists a task's comments", async () => {
    await load([comment('1'), comment('2', { taskId: 'b' }), comment('3')]);
    expect(store.forTask('a').map((c: CommentDto) => c.id)).toEqual(['1', '3']);
  });

  it("collects other people's mentions of the current user, newest first", async () => {
    await load([
      comment('old', { mentions: [CURRENT_USER.id], createdAt: '2026-01-01T09:00:00.000Z' }),
      comment('new', { mentions: [CURRENT_USER.id], createdAt: '2026-01-02T09:00:00.000Z' }),
      comment('someone-else', { mentions: ['user-003'] }),
      comment('own', { author: CURRENT_USER, mentions: [CURRENT_USER.id] }),
    ]);
    expect(store.mentions().map((c: CommentDto) => c.id)).toEqual(['new', 'old']);
    expect(store.unreadCount()).toBe(2);
  });

  it('counts only mentions newer than the last time the menu was opened, and remembers it', async () => {
    localStorage.setItem(MENTIONS_SEEN_STORAGE_KEY, '2026-01-01T12:00:00.000Z');
    await load([
      comment('read', { mentions: [CURRENT_USER.id], createdAt: '2026-01-01T09:00:00.000Z' }),
      comment('unread', { mentions: [CURRENT_USER.id], createdAt: '2026-01-02T09:00:00.000Z' }),
    ]);
    expect(store.unreadCount()).toBe(1);

    store.markMentionsSeen();
    expect(store.unreadCount()).toBe(0);
    expect(localStorage.getItem(MENTIONS_SEEN_STORAGE_KEY)).toBe(store.seenAt());
  });

  describe('add', () => {
    const task = makeTask('a', TaskStatus.Todo, 1000, { title: 'Fix bug', assignee: TEST_USER });

    it('shows the comment at once, saves it as the current user and logs the activity', async () => {
      await load([]);
      const done: Promise<boolean> = store.add(task, 'Hi @Sarah Smith', [OTHER.id]);

      expect(store.forTask('a')).toHaveLength(1);
      expect(store.forTask('a')[0].id).toMatch(/^tmp-/);
      const req: TestRequest = http.expectOne('/api/comments');
      expect(req.request.body).toMatchObject({
        taskId: 'a',
        taskTitle: 'Fix bug',
        author: CURRENT_USER,
        body: 'Hi @Sarah Smith',
        mentions: [OTHER.id],
      });
      req.flush({ ...req.request.body, id: 'c1' });

      expect(await done).toBe(true);
      expect(store.forTask('a').map((c: CommentDto) => c.id)).toEqual(['c1']);
      const activity: TestRequest = http.expectOne('/api/activities');
      expect(activity.request.body).toMatchObject({ type: 'commented', taskId: 'a', user: CURRENT_USER });
      activity.flush({ ...activity.request.body, id: 'act-1' });
    });

    it('removes the comment again when saving fails', async () => {
      await load([comment('1')]);
      const done: Promise<boolean> = store.add(task, 'Hi', []);
      http.expectOne('/api/comments').flush('down', { status: 500, statusText: 'Error' });

      expect(await done).toBe(false);
      expect(store.forTask('a').map((c: CommentDto) => c.id)).toEqual(['1']);
    });
  });
});
