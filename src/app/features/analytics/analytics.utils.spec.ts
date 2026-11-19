import { TaskPriority, TaskStatus } from '@core/dto';
import { makeTask } from '@features/dashboard/services/dashboard.test-helpers';

import { ChartSlice } from './analytics.model';
import { percentOf, prioritySlices, statusSlices } from './analytics.utils';

const values = (slices: ChartSlice[]): number[] => slices.map((s: ChartSlice) => s.value);

describe('analytics utils', () => {
  const tasks = [
    makeTask('a', TaskStatus.Todo, 1000, { priority: TaskPriority.High }),
    makeTask('b', TaskStatus.Todo, 2000, { priority: TaskPriority.High }),
    makeTask('c', TaskStatus.Done, 1000, { priority: TaskPriority.Low }),
  ];

  it('counts by status in column order, keeping empty statuses', () => {
    expect(values(statusSlices(tasks))).toEqual([2, 0, 1]);
    expect(statusSlices(tasks)[0]).toMatchObject({ labelKey: 'board.columns.todo', swatchClass: 'bg-status-todo' });
  });

  it('counts by priority from high to low', () => {
    expect(values(prioritySlices(tasks))).toEqual([2, 0, 1]);
  });

  it('handles no tasks', () => {
    expect(values(statusSlices([]))).toEqual([0, 0, 0]);
  });

  it('percentOf rounds and is safe for a zero total', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(0, 0)).toBe(0);
  });
});
