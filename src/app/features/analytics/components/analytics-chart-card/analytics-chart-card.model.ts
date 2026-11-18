import { ChartOptions } from 'chart.js';

export type ChartKind = 'doughnut' | 'bar';

export interface LegendItem {
  label: string;
  value: number;
  percent: number;
  swatchClass: string;
}

export type ChartKindOptions = ChartOptions<'doughnut'> | ChartOptions<'bar'>;
