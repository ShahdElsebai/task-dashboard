import { Component, input, output } from '@angular/core';
import type { InputSignal, OutputEmitterRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';

/**
 * Inline fallback for a section whose data failed to load.
 * Pair it with an httpResource: `@if (res.error()) { <app-error-state (retry)="res.reload()" /> }`.
 * The rest of the page keeps working, which is the point of an error boundary.
 */
@Component({
  selector: 'app-error-state',
  imports: [TranslatePipe, ButtonModule],
  templateUrl: './error-state.component.html',
})
export class ErrorStateComponent {
  /** i18n key of the message to show. */
  readonly messageKey: InputSignal<string> = input<string>('errors.loadFailed');
  /** Hide the Retry button when retrying makes no sense. */
  readonly retryable: InputSignal<boolean> = input<boolean>(true);

  readonly retry: OutputEmitterRef<void> = output<void>();
}
