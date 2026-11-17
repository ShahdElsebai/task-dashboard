import { ChangeType } from './enum.dto';
import { Identifiable } from './shared.dto';

export interface StatisticDto extends Identifiable {
  title: string;
  icon: string;
  value: number;
  change: string;
  changeLabel: string;
  changeType: ChangeType;
  color: string;
}
