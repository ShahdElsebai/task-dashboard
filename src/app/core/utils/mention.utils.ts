import { MENTION_QUERY_MAX_LENGTH, MENTION_SUGGESTION_LIMIT } from '../config/comment.config';
import { UserDto } from '../dto';

/** A mention being typed: where its `@` is and the text typed after it. */
export interface MentionQuery {
  start: number;
  query: string;
}

export type CommentSegment = { kind: 'text'; text: string } | { kind: 'mention'; text: string; userId: string };

/** Letters or digits on either side mean the `@Name` is part of a longer word, not a mention. */
const WORD_CHAR: string = '[\\p{L}\\p{N}]';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds the mention the caret is in, if any.
 *
 * A mention starts with `@` at the start of the text or after whitespace, and runs to the caret
 * without a line break or a second `@`. Spaces are allowed so full names can be typed.
 *
 * @param text The comment text.
 * @param caret The caret position in `text`.
 * @returns The `@` position and the query after it, or `null` when the caret isn't in a mention.
 */
export function mentionQueryAt(text: string, caret: number): MentionQuery | null {
  const before: string = text.slice(0, caret);
  const start: number = before.lastIndexOf('@');
  if (start === -1) return null;
  if (start > 0 && !/\s/.test(before[start - 1])) return null;

  const query: string = before.slice(start + 1);
  if (query.length > MENTION_QUERY_MAX_LENGTH || /[\n@]/.test(query) || query.startsWith(' ')) return null;
  return { start, query };
}

/**
 * People whose full name, or any word of it, starts with the query (case-insensitive).
 *
 * @param users Everyone who can be mentioned.
 * @param query Text typed after `@`; empty matches everyone.
 * @returns At most `MENTION_SUGGESTION_LIMIT` people, in the order given.
 */
export function matchUsers(users: readonly UserDto[], query: string): UserDto[] {
  const q: string = query.toLowerCase();
  return users
    .filter((user: UserDto) => {
      const name: string = user.name.toLowerCase();
      return name.startsWith(q) || name.split(' ').some((word: string) => word.startsWith(q));
    })
    .slice(0, MENTION_SUGGESTION_LIMIT);
}

/**
 * Replaces the mention being typed with `@Full Name ` and moves the caret after it.
 *
 * @param text The comment text.
 * @param mention The mention being typed, from `mentionQueryAt`.
 * @param caret The caret position in `text`.
 * @param user The person picked.
 * @returns The new text and caret position.
 */
export function insertMention(
  text: string,
  mention: MentionQuery,
  caret: number,
  user: UserDto
): { text: string; caret: number } {
  const inserted: string = `@${user.name} `;
  return {
    text: text.slice(0, mention.start) + inserted + text.slice(caret),
    caret: mention.start + inserted.length,
  };
}

function mentionPattern(users: readonly UserDto[], flags: string): RegExp | null {
  if (!users.length) return null;
  const names: string = [...users]
    .map((user: UserDto) => user.name)
    .sort((a: string, b: string) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  return new RegExp(`(?<!${WORD_CHAR})@(${names})(?!${WORD_CHAR})`, flags);
}

/**
 * Ids of the people mentioned in a comment, found by their `@Full Name`.
 *
 * Reading the final text (rather than tracking picks) means a mention typed out by hand counts,
 * and one deleted while editing doesn't.
 *
 * @param text The comment text.
 * @param users Everyone who can be mentioned.
 * @returns Unique ids, in order of first mention.
 */
export function extractMentions(text: string, users: readonly UserDto[]): string[] {
  const pattern: RegExp | null = mentionPattern(users, 'gu');
  if (!pattern) return [];
  const ids: string[] = [];
  for (const match of text.matchAll(pattern)) {
    const user: UserDto | undefined = users.find((u: UserDto) => u.name === match[1]);
    if (user && !ids.includes(user.id)) ids.push(user.id);
  }
  return ids;
}

/**
 * Splits a comment into plain text and mentions, for display.
 *
 * @param body The comment text.
 * @param mentioned The people the comment mentions; other `@` text stays plain.
 * @returns Segments in order; adjacent plain text is one segment.
 */
export function toCommentSegments(body: string, mentioned: readonly UserDto[]): CommentSegment[] {
  const pattern: RegExp | null = mentionPattern(mentioned, 'gu');
  if (!pattern) return body ? [{ kind: 'text', text: body }] : [];

  const segments: CommentSegment[] = [];
  let last: number = 0;
  for (const match of body.matchAll(pattern)) {
    const index: number = match.index;
    if (index > last) segments.push({ kind: 'text', text: body.slice(last, index) });
    const user: UserDto | undefined = mentioned.find((u: UserDto) => u.name === match[1]);
    segments.push(user ? { kind: 'mention', text: match[0], userId: user.id } : { kind: 'text', text: match[0] });
    last = index + match[0].length;
  }
  if (last < body.length) segments.push({ kind: 'text', text: body.slice(last) });
  return segments;
}
