import type { BoardColumnConfig } from '../config/board.config';
import type { TaskDto } from '../dto/task.dto';

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
