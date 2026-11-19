import { ChartOptions } from 'chart.js';
import { ChartKindOptions } from './analytics-chart-card.model';

const DOUGHNUT: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false } },
};

const BAR: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
};

export const CHART_OPTIONS: Readonly<{ doughnut: ChartOptions<'doughnut'>; bar: ChartOptions<'bar'> }> = {
  doughnut: DOUGHNUT,
  bar: BAR,
};

export function chartOptions(kind: 'doughnut' | 'bar', rtl: boolean): ChartKindOptions {
  if (kind === 'doughnut' || !rtl) return CHART_OPTIONS[kind];
  return {
    ...BAR,
    scales: {
      ...BAR.scales,
      x: { ...BAR.scales?.['x'], reverse: true },
      y: { ...BAR.scales?.['y'], position: 'right' },
    },
  };
}
