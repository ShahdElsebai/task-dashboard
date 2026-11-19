import { ActivityType } from './enum.dto';
import { Identifiable } from './shared.dto';
import { UserDto } from './user.dto';

export interface ActivityDto extends Identifiable {
  type: ActivityType;
  taskId: string;
  taskTitle: string;
  user: UserDto;
  timestamp: string;
}

export type CreateActivityDto = Omit<ActivityDto, 'id'>;
