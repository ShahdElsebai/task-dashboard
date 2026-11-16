import { TaskStatus } from '../dto/enum.dto';
import { isTaskOverdue } from './task.utils';

describe('isTaskOverdue', () => {
  const today = new Date(2026, 10, 16, 15, 0);

  it('is true when due before today and not done', () => {
    expect(isTaskOverdue({ status: TaskStatus.Todo, dueDate: '2026-11-15' }, today)).toBe(true);
  });

  it('is false when due today', () => {
    expect(isTaskOverdue({ status: TaskStatus.InProgress, dueDate: '2026-11-16' }, today)).toBe(false);
  });

  it('is false for done tasks even if past due', () => {
    expect(isTaskOverdue({ status: TaskStatus.Done, dueDate: '2026-11-01' }, today)).toBe(false);
  });
});
