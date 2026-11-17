import { Component, input, InputSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TaskPriority } from '../../../../core/dto';

@Component({
  selector: 'app-priority-badge',
  imports: [TranslatePipe],
  templateUrl: './priority-badge.component.html',
})
export class PriorityBadgeComponent {
  readonly priority: InputSignal<TaskPriority> = input.required<TaskPriority>();

  protected readonly Priority: typeof TaskPriority = TaskPriority;
}
