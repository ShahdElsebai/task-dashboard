import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { TaskDto, TaskStatus } from '@core/dto';

import { BoardColumn, TaskMoveRequest } from '../../dashboard.model';
import { makeTask } from '../../services/dashboard.test-helpers';
import { BoardColumnComponent } from './board-column.component';

describe('BoardColumnComponent', () => {
  let fixture: ComponentFixture<BoardColumnComponent>;
  let moves: TaskMoveRequest[];

  const column = (tasks: TaskDto[]): BoardColumn => ({
    status: TaskStatus.Todo,
    titleKey: 'board.columns.todo',
    tasks,
  });

  const drop = (event: Partial<CdkDragDrop<TaskStatus, TaskStatus, TaskDto>>): void =>
    (fixture.componentInstance as unknown as { onDrop: (e: unknown) => void }).onDrop(event);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColumnComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(BoardColumnComponent);
    moves = [];
    fixture.componentInstance.move.subscribe((m: TaskMoveRequest) => moves.push(m));
  });

  it('shows the header with the task count and one card per task', async () => {
    fixture.componentRef.setInput(
      'column',
      column([makeTask('a', TaskStatus.Todo, 1), makeTask('b', TaskStatus.Todo, 2)])
    );
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('header')?.textContent).toContain('2');
    expect(host.querySelectorAll('app-board-task-card')).toHaveLength(2);
  });

  it('shows an empty state when there are no tasks', async () => {
    fixture.componentRef.setInput('column', column([]));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-empty-state')).toBeTruthy();
  });

  it('emits a move with the target status and index on drop', () => {
    const container: object = { data: TaskStatus.Done };
    drop({
      item: { data: makeTask('a', TaskStatus.Todo, 1) } as never,
      container: container as never,
      previousContainer: {} as never,
      previousIndex: 0,
      currentIndex: 2,
    });
    expect(moves).toEqual([{ taskId: 'a', toStatus: TaskStatus.Done, index: 2 }]);
  });

  it('ignores a drop back in the same place', () => {
    const same: object = { data: TaskStatus.Todo };
    drop({
      item: { data: makeTask('a', TaskStatus.Todo, 1) } as never,
      container: same as never,
      previousContainer: same as never,
      previousIndex: 1,
      currentIndex: 1,
    });
    expect(moves).toEqual([]);
  });
});
