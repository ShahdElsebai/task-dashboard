import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { TaskPriority, TaskStatus } from '@core/dto';

export interface TaskFormControls {
  title: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<TaskStatus>;
  priority: FormControl<TaskPriority>;
  dueDate: FormControl<string>;
  assigneeId: FormControl<string>;
  tags: FormArray<FormControl<string>>;
}

export type TaskFormGroup = FormGroup<TaskFormControls>;

export interface SelectOption<T> {
  label: string;
  value: T;
}

export interface FieldError {
  key: string;
  params: Record<string, number>;
}

export type FieldName = 'title' | 'description' | 'dueDate' | 'assigneeId' | 'tags';
