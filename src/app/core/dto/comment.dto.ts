import { Identifiable } from './shared.dto';
import { UserDto } from './user.dto';

/**
 * A comment on a task.
 *
 * `body` is plain text; a mention appears in it as `@Full Name`. `mentions` lists the ids of
 * the people mentioned, so a comment's mentions don't depend on parsing names later.
 * `taskTitle` is copied in (as activities do) so a notification can name the task on its own.
 */
export interface CommentDto extends Identifiable {
  taskId: string;
  taskTitle: string;
  author: UserDto;
  body: string;
  mentions: string[];
  createdAt: string;
}

export type CreateCommentDto = Omit<CommentDto, 'id'>;
