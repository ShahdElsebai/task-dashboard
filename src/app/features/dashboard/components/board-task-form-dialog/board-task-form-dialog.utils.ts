import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

import { TaskDto, TaskStatus } from '@core/dto';
import { daysBetween, parseDateOnly } from '@core/utils';

import { TaskFormValue } from '../../dashboard.model';
import { FORM_ERROR_KEYS } from './board-task-form-dialog.config';
import { FieldError } from './board-task-form-dialog.model';

/** Like `Validators.required`, but text made only of spaces also fails (`{ blank: true }`). */
export const notBlank: ValidatorFn = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value?.trim() ? null : { blank: true };

/**
 * Form-group validator: the due date can't be in the past.
 *
 * A group validator because it depends on two fields. It is skipped when:
 * - the task is done (finishing an overdue task must stay possible), and
 * - the date is the one the task already had, so an overdue task can still be edited
 *   (title, tags …) without being forced to move its date.
 *
 * @param originalDueDate The task's current due date, or null when creating.
 * @param today Returns the current date; injectable for tests.
 * @return A validator that sets `{ pastDate: true }` on the group.
 */
export function dueDateValidator(originalDueDate: string | null, today: () => Date = () => new Date()): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const status: TaskStatus | undefined = group.get('status')?.value;
    const dueDate: string | undefined = group.get('dueDate')?.value;
    if (!dueDate || status === TaskStatus.Done || dueDate === originalDueDate) return null;
    return daysBetween(today(), parseDateOnly(dueDate)) < 0 ? { pastDate: true } : null;
  };
}

/**
 * Form-array validator: every tag must be unique, compared trimmed and case-insensitively
 * ("QA" and " qa " are duplicates). Empty entries are left to the `required` validator.
 */
export const uniqueTags: ValidatorFn = (array: AbstractControl): ValidationErrors | null => {
  if (!(array instanceof FormArray)) return null;
  const tags: string[] = array.controls
    .map((c: AbstractControl<unknown>) => (typeof c.value === 'string' ? c.value.trim().toLowerCase() : ''))
    .filter(Boolean);
  return new Set(tags).size === tags.length ? null : { duplicateTags: true };
};

/**
 * Turns a control's errors into the message to show under the field.
 *
 * @param errors The control's (or group's) `errors`.
 * @return The translation key of the first known error plus its params (e.g. `{ max: 100 }`
 *     for `maxlength`), or null when there is nothing to show.
 */
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

/** `YYYY-MM-DD` in local time, the format `<input type="date">` expects. */
export function toDateInput(date: Date): string {
  const pad: (n: number) => string = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
