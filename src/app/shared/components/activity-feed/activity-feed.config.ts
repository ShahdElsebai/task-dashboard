import { ActivityType } from '@core/dto';

import { ActivityMeta } from './activity-feed.model';

export const BADGE_BASE_CLASS: string = 'flex size-8 shrink-0 items-center justify-center rounded-full text-sm';

export const ACTIVITY_META: Readonly<Record<ActivityType, ActivityMeta>> = {
  [ActivityType.Created]: {
    icon: 'pi pi-plus',
    iconClass: 'bg-blue-50 text-status-todo',
    labelKey: 'activity.created',
  },
  [ActivityType.Updated]: {
    icon: 'pi pi-pencil',
    iconClass: 'bg-surface-100 text-surface-600',
    labelKey: 'activity.updated',
  },
  [ActivityType.StatusChanged]: {
    icon: 'pi pi-arrow-right-arrow-left',
    iconClass: 'bg-orange-50 text-status-progress',
    labelKey: 'activity.statusChanged',
  },
  [ActivityType.Completed]: {
    icon: 'pi pi-check',
    iconClass: 'bg-green-50 text-status-done',
    labelKey: 'activity.completed',
  },
  [ActivityType.Deleted]: {
    icon: 'pi pi-trash',
    iconClass: 'bg-red-50 text-status-overdue',
    labelKey: 'activity.deleted',
  },
  [ActivityType.Commented]: {
    icon: 'pi pi-comment',
    iconClass: 'bg-primary-50 text-primary-700',
    labelKey: 'activity.commented',
  },
};

export const ACTIVITY_FEED_REFRESH_MS: number = 60_000;
