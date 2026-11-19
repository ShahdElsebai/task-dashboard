import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';

import { ErrorStateComponent } from '../../shared';
import { TeamMemberCardComponent } from './components/team-member-card/team-member-card.component';
import { TeamStateService } from './services/team-state.service';

@Component({
  selector: 'app-team',
  imports: [TranslatePipe, SkeletonModule, ErrorStateComponent, TeamMemberCardComponent],
  providers: [TeamStateService],
  templateUrl: './team.component.html',
})
export class TeamComponent {
  protected readonly state: TeamStateService = inject(TeamStateService);
  protected readonly placeholders: number[] = [1, 2, 3, 4];
}
