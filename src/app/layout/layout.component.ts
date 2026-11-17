import { Component, WritableSignal, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DrawerModule } from '@openng/optimus-ui/drawer';

import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, TranslatePipe, DrawerModule, HeaderComponent, SidebarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly menuOpen: WritableSignal<boolean> = signal<boolean>(false);
}
