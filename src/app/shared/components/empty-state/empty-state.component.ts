import { Component, input, InputSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Friendly placeholder for empty lists and not-yet-built pages. Project extra content (e.g. a button) inside. */
@Component({
  selector: 'app-empty-state',
  imports: [TranslatePipe],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  readonly icon: InputSignal<string> = input<string>('pi pi-inbox');
  readonly titleKey: InputSignal<string> = input.required<string>();
  readonly messageKey: InputSignal<string | undefined> = input<string>();
}
