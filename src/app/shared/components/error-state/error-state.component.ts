import { Component, input, output } from '@angular/core';
import type { InputSignal, OutputEmitterRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';

@Component({
  selector: 'app-error-state',
  imports: [TranslatePipe, ButtonModule],
  templateUrl: './error-state.component.html',
})
export class ErrorStateComponent {
  readonly messageKey: InputSignal<string> = input<string>('errors.loadFailed');
  readonly retryable: InputSignal<boolean> = input<boolean>(true);

  readonly retry: OutputEmitterRef<void> = output<void>();
}
