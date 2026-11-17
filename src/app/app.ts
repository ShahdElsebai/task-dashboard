import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from '@openng/optimus-ui/toast';

import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
})
export class AppComponent {
  private readonly _language: LanguageService = inject(LanguageService);
}
