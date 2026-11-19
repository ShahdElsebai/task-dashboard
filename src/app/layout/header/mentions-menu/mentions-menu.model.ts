import { UserDto } from '@core/dto';

/** One mention as listed in the notifications menu. */
export interface MentionItem {
  id: string;
  taskId: string;
  author: UserDto;
  /** Translated "Sarah mentioned you on …" line. */
  text: string;
  timeAgo: string;
  unread: boolean;
}
