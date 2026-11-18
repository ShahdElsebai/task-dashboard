import { Component, Signal, computed, inject, output, OutputEmitterRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonModule } from '@openng/optimus-ui/button';
import { MenuModule } from '@openng/optimus-ui/menu';

import { NAV_ITEMS } from '../../core/config/navigation.config';
import { NavItem } from '../../core/models';

@Component({
  selector: 'app-sidebar',
  imports: [TranslatePipe, ButtonModule, MenuModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly router: Router = inject(Router);
  private readonly labels: Signal<Record<string, string>> = toSignal(
    this.translate.stream(NAV_ITEMS.map((item: NavItem) => item.labelKey)),
    { initialValue: {} }
  );

  readonly navigate: OutputEmitterRef<void> = output<void>();

  protected readonly items: Signal<MenuItem[]> = computed(() =>
    NAV_ITEMS.map((item: NavItem) => ({
      label: this.labels()[item.labelKey],
      icon: item.icon,
      routerLink: `/${item.path}`,
      command: () => this.navigate.emit(),
    }))
  );

  protected newTask(): void {
    void this.router.navigate(['/dashboard'], { queryParams: { task: 'new' }, queryParamsHandling: 'merge' });
    this.navigate.emit();
  }
}
