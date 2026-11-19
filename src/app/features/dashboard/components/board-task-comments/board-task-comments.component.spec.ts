import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { CommentDto, UserDto } from '@core/dto';

import { BoardTaskCommentsComponent } from './board-task-comments.component';
import { CommentPost } from './board-task-comments.model';

const ME: UserDto = { id: 'u1', name: 'John Doe', avatar: 'JD', email: '' };
const SARAH: UserDto = { id: 'u2', name: 'Sarah Smith', avatar: 'SS', email: '' };
const SAM: UserDto = { id: 'u3', name: 'Sam Lee', avatar: 'SL', email: '' };

const COMMENTS: CommentDto[] = [
  {
    id: 'c1',
    taskId: 't',
    taskTitle: 'T',
    author: SARAH,
    body: 'Thanks @John Doe, and @Sam Lee too',
    mentions: [ME.id, SAM.id],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
];

describe('BoardTaskCommentsComponent', () => {
  let fixture: ComponentFixture<BoardTaskCommentsComponent>;
  let host: HTMLElement;
  let posted: CommentPost[];

  const textarea = (): HTMLTextAreaElement => host.querySelector('textarea')!;
  const options = (): string[] =>
    Array.from(host.querySelectorAll('[role="option"] > span')).map((o: Element) => o.textContent!.trim());

  async function type(value: string): Promise<void> {
    const el: HTMLTextAreaElement = textarea();
    el.value = value;
    el.setSelectionRange(value.length, value.length);
    el.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function key(name: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
    const event: KeyboardEvent = new KeyboardEvent('keydown', { key: name, cancelable: true, ...init });
    textarea().dispatchEvent(event);
    await fixture.whenStable();
    return event;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardTaskCommentsComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(BoardTaskCommentsComponent);
    fixture.componentRef.setInput('currentUserId', ME.id);
    fixture.componentRef.setInput('users', [ME, SARAH, SAM]);
    host = fixture.nativeElement as HTMLElement;
    posted = [];
    fixture.componentInstance.post.subscribe((value: CommentPost) => posted.push(value));
    await fixture.whenStable();
  });

  it('shows an empty state, then comments with their author, time and highlighted mentions', async () => {
    expect(host.textContent).toContain('comments.empty');

    fixture.componentRef.setInput('comments', COMMENTS);
    await fixture.whenStable();

    expect(host.querySelector('h3')?.textContent).toContain('(1)');
    expect(host.textContent).toContain('Sarah Smith');
    expect(host.querySelector('time')?.textContent).toBe('3 hours ago');
    const mentions: HTMLElement[] = Array.from(host.querySelectorAll<HTMLElement>('li bdi'));
    expect(mentions.map((m: HTMLElement) => m.textContent)).toEqual(['@John Doe', '@Sam Lee']);
    expect(mentions[0].classList.contains('bg-primary-50')).toBe(true);
    expect(mentions[1].classList.contains('bg-primary-50')).toBe(false);
  });

  it('suggests other people after @ and links the textarea to the list', async () => {
    await type('Hi @s');
    expect(options()).toEqual(['Sarah Smith', 'Sam Lee']);
    expect(textarea().getAttribute('aria-controls')).toBe('task-comment-suggestions');
    expect(textarea().getAttribute('aria-activedescendant')).toBe('task-comment-suggestions-0');

    await type('Hi @jo');
    expect(options()).toEqual([]);
    expect(textarea().hasAttribute('aria-controls')).toBe(false);
  });

  it('picks a suggestion with the keyboard, then posts with the mention ids', async () => {
    await type('Ask @s');
    await key('ArrowDown');
    expect(textarea().getAttribute('aria-activedescendant')).toBe('task-comment-suggestions-1');

    const enter: KeyboardEvent = await key('Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(textarea().value).toBe('Ask @Sam Lee ');
    expect(fixture.componentInstance.draft()).toBe('Ask @Sam Lee ');
    expect(options()).toEqual([]);

    await key('Enter', { ctrlKey: true });
    expect(posted).toEqual([{ body: 'Ask @Sam Lee', mentions: [SAM.id] }]);
  });

  it('picks a suggestion with the mouse', async () => {
    await type('@sa');
    host.querySelector('[role="option"]')!.dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    await fixture.whenStable();
    expect(textarea().value).toBe('@Sarah Smith ');
  });

  it('closes suggestions on Escape without letting the key reach the dialog', async () => {
    await type('@s');
    const escape: KeyboardEvent = await key('Escape');
    expect(escape.defaultPrevented).toBe(true);
    expect(options()).toEqual([]);
  });

  it('does not post blank text or while a post is in flight', async () => {
    await type('   ');
    await key('Enter', { metaKey: true });
    expect(posted).toEqual([]);

    await type('Hello');
    fixture.componentRef.setInput('posting', true);
    await fixture.whenStable();
    await key('Enter', { ctrlKey: true });
    expect(posted).toEqual([]);
  });

  it('clears the box when the parent resets the draft', async () => {
    await type('Draft');
    fixture.componentInstance.draft.set('');
    await fixture.whenStable();
    expect(textarea().value).toBe('');
  });
});
