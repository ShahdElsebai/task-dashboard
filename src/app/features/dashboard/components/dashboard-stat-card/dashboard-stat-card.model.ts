import { ChangeType } from '@core/dto';

import { TaskStats } from '../../dashboard.model';

export interface StatCardConfig {
  id: string;
  titleKey: string;
  stat: keyof TaskStats;
  iconClass: string;
}

export interface StatCardView {
  id: string;
  titleKey: string;
  icon: string;
  iconClass: string;
  /** Null when the tasks couldn't be loaded, so the card shows a dash instead of a misleading 0. */
  value: number | null;
  change: string;
  changeLabel: string;
  changeType: ChangeType;
}
