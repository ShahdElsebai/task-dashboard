import type { TaskPriority, TaskStatus } from './enum.dto';
import type { UserDto } from './user.dto';
import type { Identifiable } from './shared.dto';

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
}

export type CreateTaskDto = Omit<TaskDto, 'id' | 'isOverdue'>;

export type UpdateTaskDto = Partial<Omit<TaskDto, 'id' | 'createdAt' | 'isOverdue'>>;
