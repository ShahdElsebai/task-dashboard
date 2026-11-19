import { UserDto } from '@core/dto';

export interface TeamMember {
  user: UserDto;
  total: number;
  open: number;
  completed: number;
  overdue: number;
  completionRate: number;
}
