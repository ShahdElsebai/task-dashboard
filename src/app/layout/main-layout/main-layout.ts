import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';

import { LanguageService } from '../../core/services/language.service';

/** App shell: header + routed page content. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, TranslatePipe, ButtonModule],
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  protected readonly language = inject(LanguageService);
}
