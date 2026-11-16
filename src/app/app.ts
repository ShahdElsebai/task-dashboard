import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LanguageService } from './core/services/language.service';
import { MainLayout } from './layout/main-layout/main-layout';

@Component({
  selector: 'app-root',
  imports: [MainLayout],
  template: '<app-main-layout />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instantiated at startup so the saved language and direction apply immediately.
  private readonly _language = inject(LanguageService);
}
