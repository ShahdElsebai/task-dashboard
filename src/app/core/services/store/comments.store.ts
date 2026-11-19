import { HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { MENTIONS_SEEN_STORAGE_KEY } from '../../config/comment.config';
import { CURRENT_USER } from '../../config/user.config';
import { ActivityType, CommentDto, CreateCommentDto, TaskDto } from '../../dto';
import { removeById, replaceById, tempId, valueOr } from '../../utils';
import { CommentsApiService } from '../api';
import { ActivityStore } from './activity.store';

function readSeenAt(): string {
  try {
    return localStorage.getItem(MENTIONS_SEEN_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeSeenAt(value: string): void {
  try {
    localStorage.setItem(MENTIONS_SEEN_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable (private mode, blocked); unread counts then reset on reload.
  }
}

/**
 * Task comments, and the current user's mentions for the notifications menu.
 *
 * Unread state is per browser: the time the menu was last opened is kept in `localStorage`,
 * and mentions newer than that count as unread.
 */
@Service()
export class CommentsStore {
  private readonly api: CommentsApiService = inject(CommentsApiService);
  private readonly activity: ActivityStore = inject(ActivityStore);
  private readonly resource: HttpResourceRef<CommentDto[]> = this.api.listResource();
  private readonly seen: WritableSignal<string> = signal<string>(readSeenAt());

  readonly comments: Signal<CommentDto[]> = computed(() => valueOr(this.resource, []));
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);

  /** When the notifications menu was last opened (ISO time), or `''` if never. */
  readonly seenAt: Signal<string> = this.seen.asReadonly();

  /** Comments by other people that mention the current user, newest first. */
  readonly mentions: Signal<CommentDto[]> = computed(() =>
    this.comments()
      .filter((c: CommentDto) => c.author.id !== CURRENT_USER.id && c.mentions.includes(CURRENT_USER.id))
      .sort((a: CommentDto, b: CommentDto) => b.createdAt.localeCompare(a.createdAt))
  );

  readonly unreadCount: Signal<number> = computed(
    () => this.mentions().filter((c: CommentDto) => c.createdAt > this.seen()).length
  );

  /** A task's comments, oldest first. Reads a signal, so it is reactive inside `computed`. */
  forTask(taskId: string): CommentDto[] {
    return this.comments().filter((c: CommentDto) => c.taskId === taskId);
  }

  /** Marks every current mention as read. */
  markMentionsSeen(): void {
    const now: string = new Date().toISOString();
    this.seen.set(now);
    writeSeenAt(now);
  }

  /**
   * Posts a comment as the current user.
   *
   * The comment shows at once with a temporary id, then is swapped for the saved one. On failure
   * it is removed again (the error interceptor shows the toast), so the caller can keep the draft.
   *
   * @param task The task being commented on.
   * @param body The comment text.
   * @param mentions Ids of the people mentioned in `body`.
   * @returns Whether the comment was saved.
   */
  async add(task: TaskDto, body: string, mentions: string[]): Promise<boolean> {
    const entry: CreateCommentDto = {
      taskId: task.id,
      taskTitle: task.title,
      author: CURRENT_USER,
      body,
      mentions,
      createdAt: new Date().toISOString(),
    };
    const id: string = tempId();
    this.mutate((items: CommentDto[]) => [...items, { ...entry, id }]);
    try {
      const saved: CommentDto = await firstValueFrom(this.api.create(entry));
      this.mutate((items: CommentDto[]) => replaceById(items, id, saved));
      this.activity.log(ActivityType.Commented, task, CURRENT_USER);
      return true;
    } catch {
      this.mutate((items: CommentDto[]) => removeById(items, id));
      return false;
    }
  }

  reload(): void {
    this.resource.reload();
  }

  /** Like `resource.value.update`, but also works after a failed load (where reading the value throws). */
  private mutate(fn: (items: CommentDto[]) => CommentDto[]): void {
    this.resource.value.set(fn(valueOr(this.resource, [])));
  }
}
