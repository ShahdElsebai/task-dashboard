import { ActivityDto, ActivityType, UserDto } from '@core/dto';

import { toActivityItem } from './activity-feed.utils';

const TEST_USER: UserDto = { id: 'user-001', name: 'Sarah Smith', avatar: 'SS', email: 'sarah@company.com' };

describe('activity feed utils', () => {
  const now: Date = new Date('2026-11-18T12:00:00Z');
  const ago = (seconds: number): string => new Date(now.getTime() - seconds * 1000).toISOString();

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
