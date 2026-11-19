import { Component, input, InputSignal } from '@angular/core';

import { AvatarModule } from '@openng/optimus-ui/avatar';

import { UserDto } from '@core/dto';

@Component({
  selector: 'app-user-avatar',
  imports: [AvatarModule],
  templateUrl: './user-avatar.component.html',
})
export class UserAvatarComponent {
  readonly user: InputSignal<UserDto> = input.required<UserDto>();
  readonly showName: InputSignal<boolean> = input<boolean>(false);
  readonly size: InputSignal<'normal' | 'large'> = input<'normal' | 'large'>('normal');

  protected firstName(): string {
    return this.user().name.split(' ')[0];
  }
}
