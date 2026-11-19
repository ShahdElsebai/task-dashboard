import { TaskStatus } from '@core/dto';

import { dueLabel } from './board-task-card.utils';

const today: Date = new Date(2026, 10, 17, 15, 0);

describe('dueLabel', () => {
  const open = (dueDate: string): ReturnType<typeof dueLabel> =>
    dueLabel({ status: TaskStatus.Todo, dueDate, completedAt: null }, today);

  it('labels overdue tasks with singular and plural keys', () => {
    expect(open('2026-11-16')).toMatchObject({ key: 'due.overdueOne', params: { count: 1 }, tone: 'overdue' });
    expect(open('2026-11-14')).toMatchObject({ key: 'due.overdueMany', params: { count: 3 }, tone: 'overdue' });
  });

  it('labels upcoming tasks and marks the next two days as soon', () => {
    expect(open('2026-11-17')).toMatchObject({ key: 'due.today', tone: 'soon' });
    expect(open('2026-11-18')).toMatchObject({ key: 'due.tomorrow', tone: 'soon' });
    expect(open('2026-11-19')).toMatchObject({ key: 'due.inDays', params: { count: 2 }, tone: 'soon' });
    expect(open('2026-11-24')).toMatchObject({ key: 'due.inDays', params: { count: 7 }, tone: 'normal' });
  });

  it('labels done tasks by completion day, never as overdue', () => {
    const done = (completedAt: string | null): ReturnType<typeof dueLabel> =>
      dueLabel({ status: TaskStatus.Done, dueDate: '2000-01-01', completedAt }, today);
    expect(done(new Date(2026, 10, 17, 9).toISOString())).toMatchObject({ key: 'due.completedToday', tone: 'done' });
    expect(done(new Date(2026, 10, 16, 9).toISOString()).key).toBe('due.completedYesterday');
    expect(done(new Date(2026, 10, 12, 9).toISOString())).toMatchObject({
      key: 'due.completedDaysAgo',
      params: { count: 5 },
    });
    expect(done(null).key).toBe('due.completed');
  });
});
