import { UserDto } from '@core/dto';

export interface CommentSegmentView {
  text: string;
  mention: boolean;
  /** Styling for a mention; empty for plain text. */
  className: string;
}

/** A comment as displayed. */
export interface CommentItem {
  id: string;
  author: UserDto;
  createdAt: string;
  timeAgo: string;
  segments: CommentSegmentView[];
  /** Shown before the server confirms it (temporary id). */
  pending: boolean;
}

/** What the comment box emits when posting. */
export interface CommentPost {
  body: string;
  mentions: string[];
}
