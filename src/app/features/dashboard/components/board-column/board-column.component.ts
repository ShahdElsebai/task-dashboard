import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { TaskDto, TaskStatus } from '@core/dto';
import { EmptyStateComponent } from '@shared';

import { BoardColumn, TaskMoveRequest } from '../../dashboard.model';
import { BoardTaskCardComponent } from '../board-task-card/board-task-card.component';
import { ReorderStep } from '../board-task-card/board-task-card.model';

@Component({
  selector: 'app-board-column',
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, TranslatePipe, BoardTaskCardComponent, EmptyStateComponent],
  templateUrl: './board-column.component.html',
})
export class BoardColumnComponent {
  readonly column: InputSignal<BoardColumn> = input.required<BoardColumn>();
  readonly labels: InputSignal<Record<string, string>> = input<Record<string, string>>({});

  readonly move: OutputEmitterRef<TaskMoveRequest> = output<TaskMoveRequest>();
  readonly edit: OutputEmitterRef<TaskDto> = output<TaskDto>();
  readonly remove: OutputEmitterRef<TaskDto> = output<TaskDto>();

  protected onDrop(event: CdkDragDrop<TaskStatus, TaskStatus, TaskDto>): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) return;
    this.move.emit({ taskId: event.item.data.id, toStatus: event.container.data, index: event.currentIndex });
  }

  /** Keyboard alternative to dragging into another column: the task goes to the bottom of it. */
  protected moveTo(task: TaskDto, status: TaskStatus): void {
    this.move.emit({ taskId: task.id, toStatus: status, index: Number.MAX_SAFE_INTEGER });
  }

  /**
   * Keyboard alternative to dragging within the column.
   *
   * @param task The card being moved.
   * @param index Its index among the visible cards.
   * @param step -1 for up, 1 for down. The index is among the cards without the moved one,
   *     so `index + step` lands exactly one place away.
   */
  protected reorder(task: TaskDto, index: number, step: ReorderStep): void {
    this.move.emit({ taskId: task.id, toStatus: this.column().status, index: index + step });
  }
}
