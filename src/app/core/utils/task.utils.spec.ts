import { TaskStatus } from '../dto/enum.dto';
import { completedAtFor, isTaskOverdue, matchesSearch } from './task.utils';

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

describe('completedAtFor', () => {
  const now: string = '2026-11-17T10:00:00.000Z';

  it('stamps when moving to done', () => {
    expect(completedAtFor({ status: TaskStatus.Todo, completedAt: null }, TaskStatus.Done, now)).toBe(now);
  });

  it('clears when leaving done', () => {
    expect(completedAtFor({ status: TaskStatus.Done, completedAt: 'x' }, TaskStatus.InProgress, now)).toBeNull();
  });

  it('keeps the value when the status does not change', () => {
    expect(completedAtFor({ status: TaskStatus.Done, completedAt: 'x' }, TaskStatus.Done, now)).toBe('x');
  });
});

describe('matchesSearch', () => {
  const task: { title: string; description: string; tags: string[] } = {
    title: 'Design homepage',
    description: 'Wireframes',
    tags: ['UI'],
  };

  it('matches title, description and tags, ignoring case and spaces', () => {
    expect(matchesSearch(task, ' design ')).toBe(true);
    expect(matchesSearch(task, 'WIRE')).toBe(true);
    expect(matchesSearch(task, 'ui')).toBe(true);
    expect(matchesSearch(task, '')).toBe(true);
    expect(matchesSearch(task, 'backend')).toBe(false);
  });
});
