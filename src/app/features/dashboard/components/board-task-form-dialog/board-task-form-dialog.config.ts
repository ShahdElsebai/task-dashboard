import { TaskPriority, TaskStatus } from '@core/dto';

import { BOARD_COLUMNS } from '../../dashboard.config';
import { BoardColumnConfig } from '../../dashboard.model';

export const TITLE_MAX_LENGTH: number = 100;
export const DESCRIPTION_MAX_LENGTH: number = 500;
export const TAG_MAX_LENGTH: number = 20;
export const MAX_TAGS: number = 5;

export const DEFAULT_STATUS: TaskStatus = TaskStatus.Todo;
export const DEFAULT_PRIORITY: TaskPriority = TaskPriority.Medium;

export const FORM_ERROR_KEYS: Readonly<Record<string, string>> = {
  required: 'taskForm.errors.required',
  blank: 'taskForm.errors.required',
  maxlength: 'taskForm.errors.maxLength',
  pastDate: 'taskForm.errors.pastDate',
  duplicateTags: 'taskForm.errors.duplicateTags',
};

export const PRIORITIES: TaskPriority[] = [TaskPriority.High, TaskPriority.Medium, TaskPriority.Low];

export const FORM_LABEL_KEYS: string[] = [
  ...BOARD_COLUMNS.map((c: BoardColumnConfig) => c.titleKey),
  ...PRIORITIES.map((p: TaskPriority) => `priority.${p}`),
];
