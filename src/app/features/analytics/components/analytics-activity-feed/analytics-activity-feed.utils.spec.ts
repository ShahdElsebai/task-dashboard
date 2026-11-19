import { ActivityDto, ActivityType } from '@core/dto';
import { TEST_USER } from '@testing';

import { timeAgo, toActivityItem } from './analytics-activity-feed.utils';

describe('activity feed utils', () => {
  const now: Date = new Date('2026-11-18T12:00:00Z');
  const ago = (seconds: number): string => new Date(now.getTime() - seconds * 1000).toISOString();

  describe('timeAgo', () => {
    it('picks the largest fitting unit', () => {
      expect(timeAgo(ago(20), now, 'en')).toBe('now');
      expect(timeAgo(ago(5 * 60), now, 'en')).toBe('5 minutes ago');
      expect(timeAgo(ago(3 * 3600), now, 'en')).toBe('3 hours ago');
      expect(timeAgo(ago(24 * 3600), now, 'en')).toBe('yesterday');
      expect(timeAgo(ago(14 * 24 * 3600), now, 'en')).toBe('2 weeks ago');
    });

    it('follows the locale', () => {
      expect(timeAgo(ago(24 * 3600), now, 'ar')).toBe('أمس');
    });
  });

  describe('toActivityItem', () => {
    const activity = (type: ActivityType): ActivityDto => ({
      id: 'act-1',
      type,
      taskId: 'task-1',
      taskTitle: 'Fix bug',
      user: TEST_USER,
      timestamp: ago(60),
    });

    it('adds the icon, label and a link to the task', () => {
      const item = toActivityItem(activity(ActivityType.Completed), now, 'en');
      expect(item).toMatchObject({
        icon: 'pi pi-check',
        labelKey: 'activity.completed',
        userName: TEST_USER.name,
        taskId: 'task-1',
        timeAgo: '1 minute ago',
      });
      expect(item.badgeClass).toContain('rounded-full');
    });

    it('has no link for deleted tasks', () => {
      expect(toActivityItem(activity(ActivityType.Deleted), now, 'en').taskId).toBeNull();
    });
  });
});
