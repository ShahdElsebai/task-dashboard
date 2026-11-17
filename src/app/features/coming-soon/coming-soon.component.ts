import { Component, input, InputSignal } from '@angular/core';

import { EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-coming-soon',
  imports: [EmptyStateComponent],
  templateUrl: './coming-soon.component.html',
})
export class ComingSoonComponent {
  readonly titleKey: InputSignal<string> = input<string>('comingSoon.title');
  readonly icon: InputSignal<string> = input<string>('pi pi-wrench');
}
