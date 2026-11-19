import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  InputSignal,
  model,
  ModelSignal,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { interval, map } from 'rxjs';

import { COMMENT_MAX_LENGTH } from '@core/config/comment.config';
import { CommentDto, UserDto } from '@core/dto';
import { LanguageService } from '@core/services/language.service';
import { extractMentions, insertMention, matchUsers, MentionQuery, mentionQueryAt } from '@core/utils';
import { UserAvatarComponent } from '@shared';

import { COMMENT_IDS, COMMENTS_REFRESH_MS } from './board-task-comments.config';
import { CommentItem, CommentPost } from './board-task-comments.model';
import { toCommentItem } from './board-task-comments.utils';

/**
 * A task's comments and the box to add one (presentational).
 *
 * Typing `@` suggests people to mention; arrow keys move through the suggestions, Enter or Tab
 * picks one, Escape closes them. Ctrl/Cmd + Enter posts. The draft is a two-way `model`, so the
 * parent clears it only once the comment is saved and a failed post keeps the text.
 */
@Component({
  selector: 'app-board-task-comments',
  imports: [TranslatePipe, ButtonModule, TextareaModule, UserAvatarComponent],
  templateUrl: './board-task-comments.component.html',
})
export class BoardTaskCommentsComponent {
  private readonly language: LanguageService = inject(LanguageService);

  readonly comments: InputSignal<CommentDto[]> = input<CommentDto[]>([]);
  readonly users: InputSignal<UserDto[]> = input<UserDto[]>([]);
  readonly currentUserId: InputSignal<string> = input.required<string>();
  readonly posting: InputSignal<boolean> = input<boolean>(false);
  readonly draft: ModelSignal<string> = model<string>('');

  readonly post: OutputEmitterRef<CommentPost> = output<CommentPost>();

  protected readonly ids: Readonly<Record<'heading' | 'input' | 'list' | 'hint', string>> = COMMENT_IDS;
  protected readonly maxLength: number = COMMENT_MAX_LENGTH;

  private readonly textarea: Signal<ElementRef<HTMLTextAreaElement>> =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('commentInput');
  private readonly mention: WritableSignal<MentionQuery | null> = signal<MentionQuery | null>(null);
  protected readonly active: WritableSignal<number> = signal<number>(0);

  private readonly now: Signal<Date> = toSignal(interval(COMMENTS_REFRESH_MS).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });

  protected readonly items: Signal<CommentItem[]> = computed(() => {
    const now: Date = this.now();
    const locale: string = this.language.current();
    return this.comments().map((c: CommentDto) => toCommentItem(c, this.users(), this.currentUserId(), now, locale));
  });

  /** Everyone but the author. */
  private readonly mentionable: Signal<UserDto[]> = computed(() =>
    this.users().filter((user: UserDto) => user.id !== this.currentUserId())
  );

  protected readonly suggestions: Signal<UserDto[]> = computed(() => {
    const mention: MentionQuery | null = this.mention();
    return mention ? matchUsers(this.mentionable(), mention.query) : [];
  });

  protected readonly activeOptionId: Signal<string | null> = computed(() =>
    this.suggestions().length ? this.optionId(this.active()) : null
  );

  protected readonly canPost: Signal<boolean> = computed(() => !this.posting() && this.draft().trim().length > 0);

  protected optionId(index: number): string {
    return `${COMMENT_IDS.list}-${index}`;
  }

  protected onInput(element: HTMLTextAreaElement): void {
    this.draft.set(element.value);
    this.updateMention(element);
  }

  /** Re-reads the mention at the caret (after typing, clicking or moving with the keyboard). */
  protected updateMention(element: HTMLTextAreaElement): void {
    this.mention.set(mentionQueryAt(element.value, element.selectionStart ?? element.value.length));
    this.active.set(0);
  }

  protected closeSuggestions(): void {
    this.mention.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const options: UserDto[] = this.suggestions();
    if (options.length) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const step: number = event.key === 'ArrowDown' ? 1 : -1;
        this.active.set((this.active() + step + options.length) % options.length);
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        this.pick(options[this.active()]);
      } else if (event.key === 'Escape') {
        this.closeSuggestions();
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submit();
    }
  }

  /** Replaces the `@query` being typed with the person's full name and keeps typing after it. */
  protected pick(user: UserDto): void {
    const mention: MentionQuery | null = this.mention();
    const element: HTMLTextAreaElement = this.textarea().nativeElement;
    if (!mention) return;
    const next: { text: string; caret: number } = insertMention(
      element.value,
      mention,
      element.selectionStart ?? element.value.length,
      user
    );
    element.value = next.text;
    this.draft.set(next.text);
    element.focus();
    element.setSelectionRange(next.caret, next.caret);
    this.closeSuggestions();
  }

  protected submit(): void {
    if (!this.canPost()) return;
    const body: string = this.draft().trim();
    this.post.emit({ body, mentions: extractMentions(body, this.mentionable()) });
  }
}
