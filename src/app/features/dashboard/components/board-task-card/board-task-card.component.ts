import { Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';
import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { MenuModule } from '@openng/optimus-ui/menu';

import { TaskDto, TaskStatus } from '@core/dto';
import { UserAvatarComponent } from '@shared';

import { BOARD_COLUMNS } from '../../dashboard.config';
import { BoardColumnConfig } from '../../dashboard.model';
import { BoardPriorityBadgeComponent } from '../board-priority-badge/board-priority-badge.component';
import { DueLabel, ReorderStep } from './board-task-card.model';
import { dueLabel } from './board-task-card.utils';

@Component({
  selector: 'app-board-task-card',
  imports: [TranslatePipe, ButtonModule, MenuModule, BoardPriorityBadgeComponent, UserAvatarComponent],
  templateUrl: './board-task-card.component.html',
})
export class BoardTaskCardComponent {
  readonly task: InputSignal<TaskDto> = input.required<TaskDto>();
  readonly labels: InputSignal<Record<string, string>> = input<Record<string, string>>({});
  readonly canMoveUp: InputSignal<boolean> = input<boolean>(false);
  readonly canMoveDown: InputSignal<boolean> = input<boolean>(false);

  readonly edit: OutputEmitterRef<TaskDto> = output<TaskDto>();
  readonly remove: OutputEmitterRef<TaskDto> = output<TaskDto>();
  readonly moveTo: OutputEmitterRef<TaskStatus> = output<TaskStatus>();
  readonly reorder: OutputEmitterRef<ReorderStep> = output<ReorderStep>();

  protected readonly due: Signal<DueLabel> = computed(() => dueLabel(this.task()));
  protected readonly overdue: Signal<boolean> = computed(() => this.due().tone === 'overdue');

  /**
   * Card actions. Besides edit and delete, the move items are the keyboard
   * alternative to drag and drop: change column, or move up/down within it.
   * Kept flat because p-menu renders items that have children as group headers.
   */
  protected readonly menuItems: Signal<MenuItem[]> = computed(() => {
    const t: Record<string, string> = this.labels();
    const reorder: MenuItem[] = [
      ...(this.canMoveUp()
        ? [{ label: t['tasks.moveUp'], icon: 'pi pi-arrow-up', command: () => this.reorder.emit(-1) }]
        : []),
      ...(this.canMoveDown()
        ? [{ label: t['tasks.moveDown'], icon: 'pi pi-arrow-down', command: () => this.reorder.emit(1) }]
        : []),
    ];
    const moves: MenuItem[] = BOARD_COLUMNS.filter((c: BoardColumnConfig) => c.status !== this.task().status).map(
      (c: BoardColumnConfig) => ({
        label: `${t['tasks.moveTo']} ${t[c.titleKey]}`,
        icon: 'pi pi-arrow-right rtl:-scale-x-100',
        command: () => this.moveTo.emit(c.status),
      })
    );
    return [
      { label: t['tasks.edit'], icon: 'pi pi-pencil', command: () => this.edit.emit(this.task()) },
      ...reorder,
      ...moves,
      { separator: true },
      { label: t['tasks.delete'], icon: 'pi pi-trash', command: () => this.remove.emit(this.task()) },
    ];
  });
}
