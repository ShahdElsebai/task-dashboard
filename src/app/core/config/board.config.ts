import { TaskStatus } from '../dto/enum.dto';

export interface BoardColumnConfig {
  status: TaskStatus;
  titleKey: string;
}

export const BOARD_COLUMNS: readonly BoardColumnConfig[] = [
  { status: TaskStatus.Todo, titleKey: 'board.columns.todo' },
  { status: TaskStatus.InProgress, titleKey: 'board.columns.inProgress' },
  { status: TaskStatus.Done, titleKey: 'board.columns.done' },
];
