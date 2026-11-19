import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';

import { EmptyStateComponent } from '@shared';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe, ButtonModule, EmptyStateComponent],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}
