import { TaskPriority } from '../../../../core/dto';
import { BOARD_COLUMNS } from '../../dashboard.config';
import { BoardColumnConfig } from '../../dashboard.model';
import { FilterOption, PriorityFilter, StatusFilter } from './board-filters.model';

export const STATUS_FILTER_OPTIONS: readonly FilterOption<StatusFilter>[] = [
  { labelKey: 'filters.all', value: 'all' },
  ...BOARD_COLUMNS.map((c: BoardColumnConfig) => ({ labelKey: c.titleKey, value: c.status })),
];

export const PRIORITY_FILTER_OPTIONS: readonly FilterOption<PriorityFilter>[] = Object.values(TaskPriority).map(
  (p: TaskPriority) => ({ labelKey: `priority.${p}`, value: p })
);
