import type { ActivityType } from './enum.dto';
import type { UserDto } from './user.dto';
import type { Identifiable } from './shared.dto';

export interface ActivityDto extends Identifiable {
  type: ActivityType;
  taskId: string;
  taskTitle: string;
  user: UserDto;
  timestamp: string;
}

export type CreateActivityDto = Omit<ActivityDto, 'id'>;
