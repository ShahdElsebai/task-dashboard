/** Primary 800 (#1565c0) on white: 5.7:1. */
export const MENTION_CLASS: string = 'font-medium text-primary-800';

/** A mention of the person reading stands out more. Primary 900 on primary 50: 8:1. */
export const SELF_MENTION_CLASS: string = 'rounded bg-primary-50 px-1 font-medium text-primary-900';

export const COMMENTS_REFRESH_MS: number = 60_000;

export const COMMENT_IDS: Readonly<Record<'heading' | 'input' | 'list' | 'hint', string>> = {
  heading: 'task-comments-heading',
  input: 'task-comment-input',
  list: 'task-comment-suggestions',
  hint: 'task-comment-hint',
};
