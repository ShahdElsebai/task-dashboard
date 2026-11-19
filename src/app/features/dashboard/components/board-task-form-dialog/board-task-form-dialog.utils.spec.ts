import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { TaskPriority, TaskStatus } from '@core/dto';
import { makeTask } from '@testing';

import {
  dueDateValidator,
  fieldError,
  notBlank,
  toDateInput,
  toFormValue,
  uniqueTags,
} from './board-task-form-dialog.utils';

describe('task form utils', () => {
  describe('notBlank', () => {
    it('fails empty and whitespace-only text', () => {
      expect(notBlank(new FormControl('   '))).toEqual({ blank: true });
      expect(notBlank(new FormControl(''))).toEqual({ blank: true });
      expect(notBlank(new FormControl(' ok '))).toBeNull();
    });
  });

  describe('dueDateValidator', () => {
    const today: () => Date = () => new Date(2026, 10, 18);
    const group = (dueDate: string, status: TaskStatus = TaskStatus.Todo): FormGroup =>
      new FormGroup({ dueDate: new FormControl(dueDate), status: new FormControl(status) });

    it('rejects a past date and accepts today or later', () => {
      const validate = dueDateValidator(null, today);
      expect(validate(group('2026-11-17'))).toEqual({ pastDate: true });
      expect(validate(group('2026-11-18'))).toBeNull();
      expect(validate(group('2027-01-01'))).toBeNull();
    });

    it('allows a past date for finished tasks', () => {
      expect(dueDateValidator(null, today)(group('2020-01-01', TaskStatus.Done))).toBeNull();
    });

    it('allows the date the task already had, so overdue tasks stay editable', () => {
      const validate = dueDateValidator('2026-11-01', today);
      expect(validate(group('2026-11-01'))).toBeNull();
      expect(validate(group('2026-11-02'))).toEqual({ pastDate: true });
    });

    it('leaves an empty date to the required validator', () => {
      expect(dueDateValidator(null, today)(group(''))).toBeNull();
    });
  });

  describe('uniqueTags', () => {
    const tags = (...values: string[]): FormArray => new FormArray(values.map((v: string) => new FormControl(v)));

    it('flags duplicates ignoring case and spaces', () => {
      expect(uniqueTags(tags('qa', ' QA '))).toEqual({ duplicateTags: true });
      expect(uniqueTags(tags('qa', 'ui'))).toBeNull();
    });

    it('ignores empty entries (required handles those)', () => {
      expect(uniqueTags(tags('', ''))).toBeNull();
    });
  });

  describe('fieldError', () => {
    it('maps the first known error to its message key, with the max length', () => {
      expect(fieldError({ required: true })).toEqual({ key: 'taskForm.errors.required', params: {} });
      expect(fieldError({ maxlength: { requiredLength: 100, actualLength: 120 } })).toEqual({
        key: 'taskForm.errors.maxLength',
        params: { max: 100 },
      });
      expect(fieldError({ somethingElse: true })).toBeNull();
      expect(fieldError(null)).toBeNull();
    });
  });

  it('toFormValue copies the editable fields', () => {
    const task = makeTask('a', TaskStatus.InProgress, 1000, { priority: TaskPriority.High, tags: ['x'] });
    const value = toFormValue(task);
    expect(value).toMatchObject({ title: task.title, status: TaskStatus.InProgress, priority: TaskPriority.High });
    expect(value.assigneeId).toBe(task.assignee.id);
    value.tags.push('y');
    expect(task.tags).toEqual(['x']);
  });

  it('toDateInput formats local dates as YYYY-MM-DD', () => {
    expect(toDateInput(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
