import { ActivityDto, ActivityType } from '@core/dto';
import { timeAgo } from '@core/utils';

import { ACTIVITY_META, BADGE_BASE_CLASS } from './activity-feed.config';
import { ActivityItem } from './activity-feed.model';

/**
 * Prepares an activity for display: icon, colours, label key and relative time.
 * Deleted tasks get no link, since there is nothing to open.
 */
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
