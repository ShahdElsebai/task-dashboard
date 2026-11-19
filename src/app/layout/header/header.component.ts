import { Component, DestroyRef, inject, output, OutputEmitterRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { CURRENT_USER } from '@core/config/user.config';
import { UserDto } from '@core/dto';
import { LanguageService } from '@core/services/language.service';
import { SearchService } from '@core/services/search.service';
import { UserAvatarComponent } from '@shared';

import { SEARCH_DEBOUNCE_MS } from './header.config';
import { MentionsMenuComponent } from './mentions-menu/mentions-menu.component';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    TranslatePipe,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    UserAvatarComponent,
    MentionsMenuComponent,
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  protected readonly language: LanguageService = inject(LanguageService);
  protected readonly search: SearchService = inject(SearchService);
  private readonly router: Router = inject(Router);
  protected readonly currentUser: UserDto = CURRENT_USER;

  readonly menuToggle: OutputEmitterRef<void> = output<void>();

  private readonly search$: Subject<string> = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((query: string) => this.applySearch(query));
  }

  protected onSearch(value: string): void {
    this.search$.next(value);
  }

  /** Search only filters the board, so searching from another page opens the dashboard with it. */
  private applySearch(query: string): void {
    this.search.set(query);
    if (query && !this.router.url.startsWith('/dashboard')) {
      void this.router.navigate(['/dashboard'], { queryParams: { q: query } });
    }
  }
}
