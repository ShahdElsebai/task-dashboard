export interface ActivityMeta {
  icon: string;
  iconClass: string;
  labelKey: string;
}

export interface ActivityItem extends ActivityMeta {
  id: string;
  taskTitle: string;
  userName: string;
  timestamp: string;
  timeAgo: string;
  badgeClass: string;
  taskId: string | null;
}
