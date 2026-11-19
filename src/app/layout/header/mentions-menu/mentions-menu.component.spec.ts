import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';
import { MenuItem, MessageService } from '@openng/optimus-ui/api';
import type { Mock } from 'vitest';

import { MENTIONS_SEEN_STORAGE_KEY } from '@core/config/comment.config';
import { CURRENT_USER } from '@core/config/user.config';
import { CommentDto, UserDto } from '@core/dto';
import { NotificationsMock, storeTestProviders } from '@testing';

import { MentionsMenuComponent } from './mentions-menu.component';
import { MentionItem } from './mentions-menu.model';

const SARAH: UserDto = { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: '' };

const mention = (id: string, createdAt: string): CommentDto => ({
  id,
  taskId: `task-${id}`,
  taskTitle: `Task ${id}`,
  author: SARAH,
  body: '@John Doe look',
  mentions: [CURRENT_USER.id],
  createdAt,
});

interface MenuInternals {
  model: () => MenuItem[];
  toggle: (menu: { visible: boolean; toggle: (e: Event) => void }, event: Event) => void;
  onHide: () => void;
}

describe('MentionsMenuComponent', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let fixture: ComponentFixture<MentionsMenuComponent>;
  let host: HTMLElement;
  let menu: MenuInternals;

  async function render(comments: CommentDto[]): Promise<void> {
    fixture = TestBed.createComponent(MentionsMenuComponent);
    host = fixture.nativeElement as HTMLElement;
    menu = fixture.componentInstance as unknown as MenuInternals;
    TestBed.tick();
    const http: HttpTestingController = TestBed.inject(HttpTestingController);
    http.expectOne('/api/comments?_sort=createdAt').flush(comments);
    http.match('/api/activities?_sort=-timestamp').forEach((r: TestRequest) => r.flush([]));
    await TestBed.inject(ApplicationRef).whenStable();
    await fixture.whenStable();
  }

  const bell = (): HTMLButtonElement => host.querySelector('button')!;
  const badge = (): string | null => host.querySelector('span[aria-hidden="true"]')?.textContent?.trim() ?? null;
  const mentionItems = (): MentionItem[] =>
    (menu.model()[0].items ?? []).map((i: MenuItem) => i.state?.['mention'] as MentionItem).filter(Boolean);

  beforeEach(() => {
    localStorage.setItem(MENTIONS_SEEN_STORAGE_KEY, '2026-01-02T00:00:00.000Z');
    TestBed.configureTestingModule({
      imports: [MentionsMenuComponent],
      providers: [
        ...storeTestProviders(notifications),
        provideRouter([{ path: 'dashboard', children: [] }]),
        provideTranslateService(),
        MessageService,
      ],
    });
  });

  afterEach(() => localStorage.removeItem(MENTIONS_SEEN_STORAGE_KEY));

  it('shows the unread count on the bell and in its accessible name', async () => {
    await render([mention('old', '2026-01-01T00:00:00.000Z'), mention('new', '2026-01-03T00:00:00.000Z')]);
    expect(badge()).toBe('1');
    expect(bell().getAttribute('aria-label')).toBe('header.notificationsUnread');
    expect(mentionItems().map((m: MentionItem) => [m.id, m.unread])).toEqual([
      ['new', true],
      ['old', false],
    ]);
  });

  it('marks mentions read when opened, keeping the "new" dots until it closes', async () => {
    await render([mention('new', '2026-01-03T00:00:00.000Z')]);
    const toggle: Mock<(e: Event) => void> = vi.fn();
    const popup: { visible: boolean; toggle: (e: Event) => void } = { visible: false, toggle };

    menu.toggle(popup, new Event('click'));
    await fixture.whenStable();
    expect(toggle).toHaveBeenCalled();
    expect(badge()).toBeNull();
    expect(bell().getAttribute('aria-label')).toBe('header.notifications');
    expect(mentionItems()[0].unread).toBe(true);

    menu.onHide();
    expect(mentionItems()[0].unread).toBe(false);
  });

  it('opens the mentioned task on the board', async () => {
    await render([mention('m1', '2026-01-03T00:00:00.000Z')]);
    const navigate: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    menu.model()[0].items![0].command!({});
    expect(navigate).toHaveBeenCalledWith(['/dashboard'], {
      queryParams: { task: 'task-m1' },
      queryParamsHandling: undefined,
    });
  });

  it('says so when there are no mentions', async () => {
    await render([]);
    expect(badge()).toBeNull();
    expect(menu.model()[0].items).toEqual([{ label: 'mentions.empty', disabled: true }]);
  });
});
