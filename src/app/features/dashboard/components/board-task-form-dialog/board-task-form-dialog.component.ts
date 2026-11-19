import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { SelectModule } from '@openng/optimus-ui/select';
import { TextareaModule } from '@openng/optimus-ui/textarea';
import { scan } from 'rxjs';

import { TaskDto, TaskPriority, TaskStatus, UserDto } from '@core/dto';

import { BOARD_COLUMNS } from '../../dashboard.config';
import { BoardColumnConfig, TaskFormValue } from '../../dashboard.model';
import {
  DEFAULT_PRIORITY,
  DEFAULT_STATUS,
  DESCRIPTION_MAX_LENGTH,
  MAX_TAGS,
  TAG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from './board-task-form-dialog.config';
import { FORM_LABEL_KEYS, PRIORITIES } from './board-task-form-dialog.config';
import { FieldError, SelectOption, TaskFormGroup } from './board-task-form-dialog.model';
import { FieldName } from './board-task-form-dialog.model';
import {
  dueDateValidator,
  fieldError,
  notBlank,
  toDateInput,
  toFormValue,
  uniqueTags,
} from './board-task-form-dialog.utils';

/**
 * Create/edit task form in a dialog (presentational).
 *
 * The parent decides when it is open (from `?task=`) and does the saving; this component owns
 * the form, its validation and the "discard unsaved changes?" check.
 */
@Component({
  selector: 'app-board-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './board-task-form-dialog.component.html',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class BoardTaskFormDialogComponent {
  private readonly fb: NonNullableFormBuilder = inject(NonNullableFormBuilder);
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly confirmation: ConfirmationService = inject(ConfirmationService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly open: InputSignal<boolean> = input.required<boolean>();
  readonly task: InputSignal<TaskDto | null> = input<TaskDto | null>(null);
  readonly users: InputSignal<UserDto[]> = input<UserDto[]>([]);
  readonly saving: InputSignal<boolean> = input<boolean>(false);

  readonly save: OutputEmitterRef<TaskFormValue> = output<TaskFormValue>();
  readonly closed: OutputEmitterRef<void> = output<void>();

  protected readonly limits: Record<string, number> = {
    title: TITLE_MAX_LENGTH,
    description: DESCRIPTION_MAX_LENGTH,
    tag: TAG_MAX_LENGTH,
    tags: MAX_TAGS,
  };
  protected readonly titleId: string = 'task-form-title';

  protected readonly form: TaskFormGroup = this.fb.group({
    title: ['', [Validators.required, notBlank, Validators.maxLength(TITLE_MAX_LENGTH)]],
    description: ['', Validators.maxLength(DESCRIPTION_MAX_LENGTH)],
    status: this.fb.control<TaskStatus>(DEFAULT_STATUS),
    priority: this.fb.control<TaskPriority>(DEFAULT_PRIORITY),
    dueDate: ['', Validators.required],
    assigneeId: ['', Validators.required],
    tags: this.fb.array<FormControl<string>>([], uniqueTags),
  });

  /**
   * Counts form events so the computeds below re-run, since reactive forms aren't signals.
   * A counter rather than a timestamp: two events in the same millisecond must still notify.
   */
  private readonly formTick: Signal<number> = toSignal(this.form.events.pipe(scan((n: number) => n + 1, 0)), {
    initialValue: 0,
  });

  protected readonly isEdit: Signal<boolean> = computed(() => this.task() !== null);
  private readonly taskId: Signal<string | null> = computed(() => this.task()?.id ?? null);
  protected readonly today: string = toDateInput(new Date());

  /**
   * The message to show under each field, once the user has touched it (or tried to submit).
   * The due date also shows the group-level "past date" error from `dueDateValidator`.
   */
  protected readonly errors: Signal<Record<FieldName, FieldError | null>> = computed(() => {
    this.formTick();
    const c: TaskFormGroup['controls'] = this.form.controls;
    const shown: (control: { invalid: boolean; touched: boolean; dirty: boolean }) => boolean = (control: {
      invalid: boolean;
      touched: boolean;
      dirty: boolean;
    }): boolean => control.invalid && (control.touched || control.dirty);
    const dateTouched: boolean = c.dueDate.touched || c.dueDate.dirty;
    return {
      title: shown(c.title) ? fieldError(c.title.errors) : null,
      description: shown(c.description) ? fieldError(c.description.errors) : null,
      dueDate: shown(c.dueDate) ? fieldError(c.dueDate.errors) : dateTouched ? fieldError(this.form.errors) : null,
      assigneeId: shown(c.assigneeId) ? fieldError(c.assigneeId.errors) : null,
      tags: fieldError(c.tags.errors),
    };
  });

  protected readonly canAddTag: Signal<boolean> = computed(() => {
    this.formTick();
    return this.form.controls.tags.length < MAX_TAGS;
  });

  private readonly labels: Signal<Record<string, string>> = toSignal(this.translate.stream(FORM_LABEL_KEYS), {
    initialValue: {},
  });

  protected readonly statusOptions: Signal<SelectOption<TaskStatus>[]> = computed(() => {
    const labels: Record<string, string> = this.labels();
    return BOARD_COLUMNS.map((c: BoardColumnConfig) => ({ label: labels[c.titleKey] ?? c.titleKey, value: c.status }));
  });

  protected readonly priorityOptions: Signal<SelectOption<TaskPriority>[]> = computed(() => {
    const labels: Record<string, string> = this.labels();
    return PRIORITIES.map((p: TaskPriority) => ({ label: labels[`priority.${p}`] ?? p, value: p }));
  });

  constructor() {
    // Refill the form when the dialog opens or switches task. Tracks the id, not the task
    // object, so a background refresh of the same task doesn't wipe what the user is typing.
    effect(() => {
      if (!this.open()) return;
      this.taskId();
      untracked(() => this.reset(this.task()));
    });
  }

  protected addTag(value: string = ''): void {
    if (this.form.controls.tags.length >= MAX_TAGS) return;
    this.form.controls.tags.push(
      this.fb.control(value, [Validators.required, notBlank, Validators.maxLength(TAG_MAX_LENGTH)])
    );
  }

  protected removeTag(index: number): void {
    this.form.controls.tags.removeAt(index);
    this.form.markAsDirty();
  }

  protected tagError(control: FormControl<string>): FieldError | null {
    this.formTick();
    return control.invalid && (control.touched || control.dirty) ? fieldError(control.errors) : null;
  }

  /** Emits the value when valid; otherwise reveals every error and focuses the first invalid field. */
  protected submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }

  /** Cancel, Escape and ×: closes straight away, or asks first if there are unsaved changes. */
  protected requestClose(): void {
    if (this.saving()) return;
    if (!this.form.dirty) {
      this.closed.emit();
      return;
    }
    this.confirmation.confirm({
      header: this.translate.instant('taskForm.discardTitle'),
      message: this.translate.instant('taskForm.discardMessage'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translate.instant('taskForm.discard'),
      rejectLabel: this.translate.instant('taskForm.keepEditing'),
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => this.closed.emit(),
    });
  }

  /** p-dialog would focus its first button (×) on open; the title field is more useful. */
  protected focusTitle(): void {
    this.host.nativeElement.ownerDocument.getElementById('task-title')?.focus();
  }

  /** Makes the browser ask before leaving the page while the form has unsaved changes. */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.open() && this.form.dirty) event.preventDefault();
  }

  private reset(task: TaskDto | null): void {
    this.form.controls.tags.clear({ emitEvent: false });
    const value: TaskFormValue = task
      ? toFormValue(task)
      : {
          title: '',
          description: '',
          status: DEFAULT_STATUS,
          priority: DEFAULT_PRIORITY,
          dueDate: '',
          assigneeId: '',
          tags: [],
        };
    value.tags.forEach((tag: string) => this.addTag(tag));
    this.form.setValidators(dueDateValidator(task?.dueDate ?? null));
    this.form.reset({ ...value, tags: value.tags });
  }

  private focusFirstInvalid(): void {
    queueMicrotask(() => {
      const invalid: HTMLElement | null = this.host.nativeElement.ownerDocument.querySelector(
        '.task-form .ng-invalid:not(form):not(fieldset), .task-form [data-invalid="true"]'
      );
      const target: HTMLElement | null =
        invalid?.matches('input, textarea') === true
          ? invalid
          : (invalid?.querySelector<HTMLElement>('input, [tabindex="0"]') ?? null);
      target?.focus();
    });
  }
}
