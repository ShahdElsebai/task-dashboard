import { CommentDto, UserDto } from '@core/dto';
import { CommentSegment, timeAgo, toCommentSegments } from '@core/utils';

import { MENTION_CLASS, SELF_MENTION_CLASS } from './board-task-comments.config';
import { CommentItem } from './board-task-comments.model';

/**
 * Prepares a comment for display: relative time, and its text split into plain parts and mentions.
 *
 * @param comment The comment.
 * @param users Everyone known; only those in `comment.mentions` are highlighted.
 * @param currentUserId The reader, whose own mentions are emphasised.
 * @param now The current time.
 * @param locale The UI language.
 */
export function toCommentItem(
  comment: CommentDto,
  users: readonly UserDto[],
  currentUserId: string,
  now: Date,
  locale: string
): CommentItem {
  const mentioned: UserDto[] = users.filter((user: UserDto) => comment.mentions.includes(user.id));
  return {
    id: comment.id,
    author: comment.author,
    createdAt: comment.createdAt,
    timeAgo: timeAgo(comment.createdAt, now, locale),
    pending: comment.id.startsWith('tmp-'),
    segments: toCommentSegments(comment.body, mentioned).map((segment: CommentSegment) => ({
      text: segment.text,
      mention: segment.kind === 'mention',
      className:
        segment.kind === 'mention' ? (segment.userId === currentUserId ? SELF_MENTION_CLASS : MENTION_CLASS) : '',
    })),
  };
}
