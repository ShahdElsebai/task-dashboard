import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';
import { Confirmation, ConfirmationService } from '@openng/optimus-ui/api';

import { TaskDto, TaskPriority, TaskStatus } from '@core/dto';

import { TaskFormValue } from '../../dashboard.model';
import { makeTask, TEST_USER } from '../../services/dashboard.test-helpers';
import { BoardTaskFormDialogComponent } from './board-task-form-dialog.component';
import { FieldError, TaskFormGroup } from './board-task-form-dialog.model';

interface FormInternals {
  form: TaskFormGroup;
  errors: () => Record<string, FieldError | null>;
  submit: () => void;
  requestClose: () => void;
  addTag: (value?: string) => void;
}

describe('BoardTaskFormDialogComponent', () => {
  let fixture: ComponentFixture<BoardTaskFormDialogComponent>;
  let ui: FormInternals;
  let saved: TaskFormValue[];
  let closed: number;
  let confirm: ReturnType<typeof vi.spyOn>;

  async function open(task: TaskDto | null = null): Promise<void> {
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
  }

  function fillValid(): void {
    ui.form.patchValue({ title: 'Write docs', dueDate: '2099-05-01', assigneeId: TEST_USER.id });
    ui.form.markAsDirty();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardTaskFormDialogComponent],
      providers: [provideTranslateService(), ConfirmationService],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardTaskFormDialogComponent);
    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('users', [TEST_USER]);
    ui = fixture.componentInstance as unknown as FormInternals;
    saved = [];
    closed = 0;
    fixture.componentInstance.save.subscribe((v: TaskFormValue) => saved.push(v));
    fixture.componentInstance.closed.subscribe(() => closed++);
    confirm = vi.spyOn(TestBed.inject(ConfirmationService), 'confirm');
  });

  describe('create', () => {
    beforeEach(() => open());

    it('starts empty with sensible defaults', () => {
      expect(ui.form.getRawValue()).toMatchObject({
        title: '',
        status: TaskStatus.Todo,
        priority: TaskPriority.Medium,
        tags: [],
      });
    });

    it('does not save an invalid form and shows the required errors', () => {
      ui.submit();
      expect(saved).toEqual([]);
      expect(ui.errors()['title']?.key).toBe('taskForm.errors.required');
      expect(ui.errors()['dueDate']?.key).toBe('taskForm.errors.required');
      expect(ui.errors()['assigneeId']?.key).toBe('taskForm.errors.required');
    });

    it('rejects a title made only of spaces', () => {
      ui.form.controls.title.setValue('   ');
      ui.form.controls.title.markAsTouched();
      expect(ui.errors()['title']?.key).toBe('taskForm.errors.required');
    });

    it('rejects a past due date (group validator)', () => {
      fillValid();
      ui.form.controls.dueDate.setValue('2000-01-01');
      ui.form.controls.dueDate.markAsTouched();
      expect(ui.errors()['dueDate']?.key).toBe('taskForm.errors.pastDate');
    });

    it('adds tags up to the limit and rejects duplicates', () => {
      ui.addTag('qa');
      ui.addTag('QA');
      expect(ui.errors()['tags']?.key).toBe('taskForm.errors.duplicateTags');
      ['a', 'b', 'c', 'd'].forEach((t: string) => ui.addTag(t));
      expect(ui.form.controls.tags.length).toBe(5);
    });

    it('emits the form value when valid', () => {
      fillValid();
      ui.addTag('docs');
      ui.submit();
      expect(saved).toEqual([
        {
          title: 'Write docs',
          description: '',
          status: TaskStatus.Todo,
          priority: TaskPriority.Medium,
          dueDate: '2099-05-01',
          assigneeId: TEST_USER.id,
          tags: ['docs'],
        },
      ]);
    });

    it('ignores submit while saving', () => {
      fillValid();
      fixture.componentRef.setInput('saving', true);
      ui.submit();
      expect(saved).toEqual([]);
    });
  });

  describe('edit', () => {
    const task: TaskDto = makeTask('t1', TaskStatus.InProgress, 1000, {
      title: 'Fix bug',
      dueDate: '2020-01-01',
      tags: ['backend'],
    });

    beforeEach(() => open(task));

    it('fills the form from the task, tags included', () => {
      expect(ui.form.getRawValue()).toMatchObject({
        title: 'Fix bug',
        status: TaskStatus.InProgress,
        tags: ['backend'],
      });
      expect(ui.form.pristine).toBe(true);
    });

    it('keeps an overdue task editable without changing its date', () => {
      ui.form.controls.title.setValue('Fix bug now');
      ui.submit();
      expect(saved[0]?.title).toBe('Fix bug now');
    });

    it("keeps the user's input when the same task is refreshed", async () => {
      ui.form.controls.title.setValue('Typing…');
      fixture.componentRef.setInput('task', { ...task, updatedAt: 'later' });
      await fixture.whenStable();
      expect(ui.form.controls.title.value).toBe('Typing…');
    });
  });

  describe('closing', () => {
    beforeEach(() => open());

    it('closes straight away when nothing changed', () => {
      ui.requestClose();
      expect(confirm).not.toHaveBeenCalled();
      expect(closed).toBe(1);
    });

    it('asks before discarding changes', () => {
      ui.form.controls.title.setValue('draft');
      ui.form.markAsDirty();
      ui.requestClose();
      expect(closed).toBe(0);
      (confirm.mock.calls[0][0] as Confirmation).accept?.();
      expect(closed).toBe(1);
    });
  });
});
