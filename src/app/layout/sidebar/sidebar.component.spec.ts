import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import { NAV_ITEMS } from '@core/config/navigation.config';

import { SidebarComponent } from './sidebar.component';

@Component({ selector: 'app-blank', template: '' })
class BlankComponent {}

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([{ path: 'dashboard', component: BlankComponent }]), provideTranslateService()],
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

  it('New Task opens the create dialog via ?task=new and asks the drawer to close', async () => {
    let navigated: boolean = false;
    fixture.componentInstance.navigate.subscribe(() => (navigated = true));
    host.querySelector<HTMLButtonElement>('p-button button')!.click();
    await fixture.whenStable();
    expect(navigated).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/dashboard?task=new');
  });
});
