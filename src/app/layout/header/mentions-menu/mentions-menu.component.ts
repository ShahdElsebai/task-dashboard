import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { Menu, MenuModule } from '@openng/optimus-ui/menu';

import { MENTIONS_MENU_LIMIT } from '@core/config/comment.config';
import { CommentDto } from '@core/dto';
import { LanguageService } from '@core/services/language.service';
import { CommentsStore } from '@core/services/store';
import { UserAvatarComponent } from '@shared';

import { MentionItem } from './mentions-menu.model';
import { toMentionItems } from './mentions-menu.utils';

/**
 * Wraps text in Unicode first-strong isolates, so an English name or title keeps its own
 * direction inside an Arabic sentence (the text equivalent of `<bdi>`).
 */
function isolate(text: string): string {
  return `\u2068${text}\u2069`;
}

/**
 * The header bell: mentions of the current user in task comments.
 *
 * The badge counts mentions since the menu was last opened. Opening it marks them read, but
 * the ones that were new keep a dot until it closes, so the reader can see which they were.
 * Picking a mention opens the task (and its comments) on the board.
 */
@Component({
  selector: 'app-mentions-menu',
  imports: [TranslatePipe, ButtonModule, MenuModule, UserAvatarComponent],
  templateUrl: './mentions-menu.component.html',
})
export class MentionsMenuComponent {
  private readonly store: CommentsStore = inject(CommentsStore);
  private readonly router: Router = inject(Router);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly language: LanguageService = inject(LanguageService);

  protected readonly menuId: string = 'mentions-menu';
  protected readonly unreadCount: Signal<number> = this.store.unreadCount;

  /** `seenAt` as it was when the menu opened; drives the "new" dots while it is open. */
  private readonly openedSeenAt: WritableSignal<string | null> = signal<string | null>(null);
  private readonly openedAt: WritableSignal<Date> = signal<Date>(new Date());

  protected readonly buttonLabel: Signal<string> = computed(() => {
    this.language.current();
    const count: number = this.unreadCount();
    return count
      ? this.translate.instant('header.notificationsUnread', { count })
      : this.translate.instant('header.notifications');
  });

  protected readonly badge: Signal<string> = computed(() => {
    const count: number = this.unreadCount();
    return count > 9 ? '9+' : String(count);
  });

  protected readonly items: Signal<MentionItem[]> = computed(() => {
    const locale: string = this.language.current();
    const describe: (comment: CommentDto) => string = (comment: CommentDto): string =>
      this.translate.instant('mentions.item', { name: isolate(comment.author.name), task: isolate(comment.taskTitle) });
    return toMentionItems(
      this.store.mentions().slice(0, MENTIONS_MENU_LIMIT),
      this.openedSeenAt() ?? this.store.seenAt(),
      describe,
      this.openedAt(),
      locale
    );
  });

  protected readonly model: Signal<MenuItem[]> = computed(() => {
    this.language.current();
    const items: MentionItem[] = this.items();
    return [
      {
        label: this.translate.instant('mentions.title'),
        items: items.length
          ? items.map((item: MentionItem) => ({
              // No label: the item's name then comes from its visible content (text, time, "New").
              id: `mention-${item.id}`,
              state: { mention: item },
              command: (): void => this.open(item),
            }))
          : [{ label: this.translate.instant('mentions.empty'), disabled: true }],
      },
    ];
  });

  protected toggle(menu: Menu, event: Event): void {
    if (!menu.visible) {
      this.openedSeenAt.set(this.store.seenAt());
      this.openedAt.set(new Date());
      this.store.markMentionsSeen();
    }
    menu.toggle(event);
  }

  protected onHide(): void {
    this.openedSeenAt.set(null);
  }

  /** Opens the task on the board; on the board already, its filters stay as they are. */
  private open(item: MentionItem): void {
    const onBoard: boolean = this.router.url.startsWith('/dashboard');
    void this.router.navigate(['/dashboard'], {
      queryParams: { task: item.taskId },
      queryParamsHandling: onBoard ? 'merge' : undefined,
    });
  }
}
