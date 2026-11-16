import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';

import { LanguageService } from '../core/services/language.service';
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, TranslatePipe, ButtonModule],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly language = inject(LanguageService);
}
