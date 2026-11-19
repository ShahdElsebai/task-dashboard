import { CommentDto } from '@core/dto';
import { timeAgo } from '@core/utils';

import { MentionItem } from './mentions-menu.model';

/**
 * Prepares mentions for the notifications menu.
 *
 * @param mentions Mentions of the current user, newest first.
 * @param seenAt When the menu was opened before this time (ISO); newer mentions are unread.
 * @param describe Builds the translated line for one mention.
 * @param now The current time.
 * @param locale The UI language.
 */
export function toMentionItems(
  mentions: readonly CommentDto[],
  seenAt: string,
  describe: (comment: CommentDto) => string,
  now: Date,
  locale: string
): MentionItem[] {
  return mentions.map((comment: CommentDto) => ({
    id: comment.id,
    taskId: comment.taskId,
    author: comment.author,
    text: describe(comment),
    timeAgo: timeAgo(comment.createdAt, now, locale),
    unread: comment.createdAt > seenAt,
  }));
}
