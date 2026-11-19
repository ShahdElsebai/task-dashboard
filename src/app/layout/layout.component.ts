import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { DrawerModule } from '@openng/optimus-ui/drawer';
import { ToastModule } from '@openng/optimus-ui/toast';

import { LANGUAGES } from '@core/config/i18n.config';
import { LanguageService } from '@core/services/language.service';

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, TranslatePipe, DrawerModule, ToastModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly language: LanguageService = inject(LanguageService);

  /** Toasts sit in the top corner on the reading-end side: top-right in English, top-left in Arabic. */
  /** Moves focus to the main content. A plain `#main` link would navigate and drop the query string. */
  protected skipToContent(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }

  protected readonly toastPosition: Signal<'top-right' | 'top-left'> = computed(() =>
    LANGUAGES[this.language.current()].dir === 'rtl' ? 'top-left' : 'top-right'
  );

  protected readonly menuOpen: WritableSignal<boolean> = signal<boolean>(false);
}
