import { TaskPriority, TaskStatus } from '../../../../core/dto';

export type StatusFilter = TaskStatus | 'all';
export type PriorityFilter = TaskPriority | null;

export interface FilterOption<T> {
  labelKey: string;
  value: T;
}

export interface FilterSelectOption<T> {
  label: string;
  value: T;
}
