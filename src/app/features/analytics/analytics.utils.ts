import { TaskDto } from '../../core/dto';
import { PRIORITY_SLICES, STATUS_SLICES } from './analytics.config';
import { ChartSlice, SliceConfig } from './analytics.model';

export function toSlices<K>(
  tasks: readonly TaskDto[],
  configs: readonly SliceConfig<K>[],
  keyOf: (task: TaskDto) => K
): ChartSlice[] {
  const counts: Map<K, number> = new Map<K, number>();
  for (const task of tasks) counts.set(keyOf(task), (counts.get(keyOf(task)) ?? 0) + 1);
  return configs.map((c: SliceConfig<K>) => ({
    labelKey: c.labelKey,
    color: c.color,
    swatchClass: c.swatchClass,
    value: counts.get(c.key) ?? 0,
  }));
}

export function statusSlices(tasks: readonly TaskDto[]): ChartSlice[] {
  return toSlices(tasks, STATUS_SLICES, (t: TaskDto) => t.status);
}

export function prioritySlices(tasks: readonly TaskDto[]): ChartSlice[] {
  return toSlices(tasks, PRIORITY_SLICES, (t: TaskDto) => t.priority);
}

export function percentOf(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}
