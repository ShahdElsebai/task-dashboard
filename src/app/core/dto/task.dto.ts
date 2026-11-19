import { TaskPriority, TaskStatus } from './enum.dto';
import { Identifiable } from './shared.dto';
import { UserDto } from './user.dto';

export interface TaskDto extends Identifiable {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue?: boolean;
  completedAt?: string | null;
  assignee: UserDto;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  position: number;
}

export type CreateTaskDto = Omit<TaskDto, 'id' | 'isOverdue'>;

export type UpdateTaskDto = Partial<Omit<TaskDto, 'id' | 'createdAt' | 'isOverdue'>>;
