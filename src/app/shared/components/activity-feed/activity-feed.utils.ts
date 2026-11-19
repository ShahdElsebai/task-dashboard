import { ActivityDto, ActivityType } from '@core/dto';

import { ACTIVITY_META, BADGE_BASE_CLASS, TIME_UNITS } from './activity-feed.config';
import { ActivityItem } from './activity-feed.model';

export function timeAgo(timestamp: string, now: Date, locale: string): string {
  const format: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds: number = Math.round((new Date(timestamp).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of TIME_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, 'second');
}

export function toActivityItem(activity: ActivityDto, now: Date, locale: string): ActivityItem {
  return {
    ...ACTIVITY_META[activity.type],
    id: activity.id,
    taskTitle: activity.taskTitle,
    userName: activity.user.name,
    timestamp: activity.timestamp,
    timeAgo: timeAgo(activity.timestamp, now, locale),
    badgeClass: `${BADGE_BASE_CLASS} ${ACTIVITY_META[activity.type].iconClass}`,
    taskId: activity.type === ActivityType.Deleted ? null : activity.taskId,
  };
}
