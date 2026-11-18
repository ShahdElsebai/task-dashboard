import { Component, input, InputSignal } from '@angular/core';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';

@Component({
  selector: 'app-dashboard-skeleton',
  imports: [SkeletonModule],
  templateUrl: './dashboard-skeleton.component.html',
})
export class DashboardSkeletonComponent {
  readonly variant: InputSignal<'stats' | 'columns'> = input.required<'stats' | 'columns'>();

  protected readonly statSlots: number[] = [1, 2, 3, 4];
  protected readonly columnSlots: number[] = [1, 2, 3];
}
