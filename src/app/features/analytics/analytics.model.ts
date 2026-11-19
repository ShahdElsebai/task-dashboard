import { TaskPriority, TaskStatus } from '../../core/dto';

export interface ChartSlice {
  labelKey: string;
  value: number;
  color: string;
  swatchClass: string;
}

export interface SliceConfig<K> {
  key: K;
  labelKey: string;
  color: string;
  swatchClass: string;
}

export type StatusSliceConfig = SliceConfig<TaskStatus>;
export type PrioritySliceConfig = SliceConfig<TaskPriority>;
