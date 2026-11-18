import { ChangeType } from '../../../../core/dto';
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
  value: number;
  change: string;
  changeLabel: string;
  changeType: ChangeType;
}
