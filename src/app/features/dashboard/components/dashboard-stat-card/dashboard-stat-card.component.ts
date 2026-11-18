import { Component, input, InputSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ChangeType } from '../../../../core/dto';
import { StatCardView } from './dashboard-stat-card.model';

@Component({
  selector: 'app-dashboard-stat-card',
  imports: [TranslatePipe],
  templateUrl: './dashboard-stat-card.component.html',
})
export class DashboardStatCardComponent {
  readonly stat: InputSignal<StatCardView> = input.required<StatCardView>();

  protected readonly Change: typeof ChangeType = ChangeType;
}
