import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

import { TaskDto, TaskStatus } from '../../../../core/dto';
import { daysBetween, parseDateOnly } from '../../../../core/utils';
import { TaskFormValue } from '../../dashboard.model';
import { FORM_ERROR_KEYS } from './board-task-form-dialog.config';
import { FieldError } from './board-task-form-dialog.model';

export const notBlank: ValidatorFn = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value?.trim() ? null : { blank: true };

export function dueDateValidator(originalDueDate: string | null, today: () => Date = () => new Date()): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const status: TaskStatus | undefined = group.get('status')?.value;
    const dueDate: string | undefined = group.get('dueDate')?.value;
    if (!dueDate || status === TaskStatus.Done || dueDate === originalDueDate) return null;
    return daysBetween(today(), parseDateOnly(dueDate)) < 0 ? { pastDate: true } : null;
  };
}

export const uniqueTags: ValidatorFn = (array: AbstractControl): ValidationErrors | null => {
  if (!(array instanceof FormArray)) return null;
  const tags: string[] = array.controls
    .map((c: AbstractControl<unknown>) => (typeof c.value === 'string' ? c.value.trim().toLowerCase() : ''))
    .filter(Boolean);
  return new Set(tags).size === tags.length ? null : { duplicateTags: true };
};

export function fieldError(errors: ValidationErrors | null | undefined): FieldError | null {
  if (!errors) return null;
  const name: string | undefined = Object.keys(errors).find((key: string) => key in FORM_ERROR_KEYS);
  if (!name) return null;
  const detail: unknown = errors[name];
  const max: number | undefined =
    typeof detail === 'object' &&
    detail !== null &&
    'requiredLength' in detail &&
    typeof detail.requiredLength === 'number'
      ? detail.requiredLength
      : undefined;
  return { key: FORM_ERROR_KEYS[name], params: max === undefined ? {} : { max } };
}

export function toFormValue(task: TaskDto): TaskFormValue {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assigneeId: task.assignee.id,
    tags: [...task.tags],
  };
}

export function toDateInput(date: Date): string {
  const pad: (n: number) => string = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
