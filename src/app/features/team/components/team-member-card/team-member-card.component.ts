import { Component, input, InputSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';

import { UserAvatarComponent } from '../../../../shared';
import { TeamMember } from '../../team.model';

@Component({
  selector: 'app-team-member-card',
  imports: [RouterLink, TranslatePipe, ButtonModule, ProgressBarModule, UserAvatarComponent],
  templateUrl: './team-member-card.component.html',
})
export class TeamMemberCardComponent {
  readonly member: InputSignal<TeamMember> = input.required<TeamMember>();
}
