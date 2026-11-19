export const COMMENTS_API_PATH: string = 'comments';

export const COMMENT_MAX_LENGTH: number = 1000;

/** Most people suggested at once while typing a mention. */
export const MENTION_SUGGESTION_LIMIT: number = 5;

/** Longest text after `@` still treated as a name being typed. */
export const MENTION_QUERY_MAX_LENGTH: number = 30;

/** Most mentions listed in the header's notifications menu. */
export const MENTIONS_MENU_LIMIT: number = 8;

/** When this browser last opened the notifications menu (ISO time); newer mentions count as unread. */
export const MENTIONS_SEEN_STORAGE_KEY: string = 'app.mentions.seenAt';
