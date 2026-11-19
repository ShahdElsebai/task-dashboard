import { Component, computed, input, output, InputSignal, OutputEmitterRef, Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { MenuModule } from '@openng/optimus-ui/menu';

import { TaskDto } from '../../../../core/dto';
import { UserAvatarComponent } from '../../../../shared';
import { BoardPriorityBadgeComponent } from '../board-priority-badge/board-priority-badge.component';
import { DueLabel } from './board-task-card.model';
import { dueLabel } from './board-task-card.utils';

@Component({
  selector: 'app-board-task-card',
  imports: [TranslatePipe, ButtonModule, MenuModule, BoardPriorityBadgeComponent, UserAvatarComponent],
  templateUrl: './board-task-card.component.html',
})
export class BoardTaskCardComponent {
  readonly task: InputSignal<TaskDto> = input.required<TaskDto>();
  readonly labels: InputSignal<Record<string, string>> = input<Record<string, string>>({});

  readonly edit: OutputEmitterRef<TaskDto> = output<TaskDto>();
  readonly remove: OutputEmitterRef<TaskDto> = output<TaskDto>();

  protected readonly due: Signal<DueLabel> = computed(() => dueLabel(this.task()));
  protected readonly overdue: Signal<boolean> = computed(() => this.due().tone === 'overdue');

  protected readonly menuItems: Signal<MenuItem[]> = computed(() => {
    const t: Record<string, string> = this.labels();
    return [
      { label: t['tasks.edit'], icon: 'pi pi-pencil', command: () => this.edit.emit(this.task()) },
      { separator: true },
      { label: t['tasks.delete'], icon: 'pi pi-trash', command: () => this.remove.emit(this.task()) },
    ];
  });
}
