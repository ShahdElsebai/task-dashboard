import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { NAV_ITEMS } from '../../core/config/navigation.config';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('renders one link per nav item', () => {
    const links: HTMLAnchorElement[] = Array.from(host.querySelectorAll('a'));
    expect(links.map((a: HTMLAnchorElement) => a.getAttribute('href'))).toEqual(
      NAV_ITEMS.map((item: { path: string }) => `/${item.path}`)
    );
  });

  it('New Task asks the drawer to close', () => {
    let navigated: boolean = false;
    fixture.componentInstance.navigate.subscribe(() => (navigated = true));
    host.querySelector<HTMLButtonElement>('p-button button')!.click();
    expect(navigated).toBe(true);
  });
});
