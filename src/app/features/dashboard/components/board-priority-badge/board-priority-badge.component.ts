import { Component, input, InputSignal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { TaskPriority } from '@core/dto';

@Component({
  selector: 'app-board-priority-badge',
  imports: [TranslatePipe],
  templateUrl: './board-priority-badge.component.html',
})
export class BoardPriorityBadgeComponent {
  readonly priority: InputSignal<TaskPriority> = input.required<TaskPriority>();

  protected readonly Priority: typeof TaskPriority = TaskPriority;
}
