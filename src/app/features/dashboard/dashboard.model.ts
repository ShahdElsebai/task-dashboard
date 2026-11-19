import { TaskDto, TaskPriority, TaskStatus, UpdateTaskDto, UserDto } from '@core/dto';

export interface BoardColumnConfig {
  status: TaskStatus;
  titleKey: string;
}

export interface BoardColumn extends BoardColumnConfig {
  tasks: TaskDto[];
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TaskFilters {
  search: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  assigneeId: string | null;
}

export interface TaskFormValue {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  tags: string[];
}

export interface TaskMoveRequest {
  taskId: string;
  toStatus: TaskStatus;
  index: number;
}

export interface PositionUpdate {
  id: string;
  position: number;
}

export interface TaskUpdate {
  id: string;
  changes: UpdateTaskDto;
}

export interface UpdateTaskContext {
  assignee?: UserDto;
  endPosition: (status: TaskStatus) => number;
  now?: string;
}

export type Sortable = Pick<TaskDto, 'id' | 'position'>;

export type Positioned = Pick<TaskDto, 'position'>;
