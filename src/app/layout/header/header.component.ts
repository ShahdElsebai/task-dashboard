import { Component, DestroyRef, inject, output, OutputEmitterRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { UserDto } from '../../core/dto';
import { LanguageService } from '../../core/services/language.service';
import { BoardStateService } from '../../features/dashboard/services/board-state.service';
import { UserAvatarComponent } from '../../shared';
import { CURRENT_USER, SEARCH_DEBOUNCE_MS } from './header.config';

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
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  protected readonly language: LanguageService = inject(LanguageService);
  protected readonly board: BoardStateService = inject(BoardStateService);
  protected readonly currentUser: UserDto = CURRENT_USER;

  readonly menuToggle: OutputEmitterRef<void> = output<void>();

  private readonly search$: Subject<string> = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((search: string) => this.board.setFilters({ search }));
  }

  protected onSearch(value: string): void {
    this.search$.next(value);
  }
}
