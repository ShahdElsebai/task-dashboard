import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { UserDto } from '@core/dto';

import { EmptyStateComponent, UserAvatarComponent } from '.';

const user: UserDto = { id: 'u1', name: 'Sarah Smith', avatar: 'SS', email: 's@x.com' };

@Component({
  selector: 'app-host',
  imports: [UserAvatarComponent, EmptyStateComponent],
  template: `
    <app-user-avatar [showName]="true" [user]="user" />
    <app-empty-state messageKey="empty.message" titleKey="empty.title"
      ><button type="button">Add</button></app-empty-state
    >
  `,
})
class HostComponent {
  readonly user: UserDto = user;
}

describe('shared UI', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('user avatar shows initials and @FirstName', () => {
    expect(host.querySelector('app-user-avatar')?.textContent).toContain('SS');
    expect(host.querySelector('app-user-avatar')?.textContent).toContain('@Sarah');
  });

  it('empty state shows its texts and projected content', () => {
    const empty: HTMLElement = host.querySelector('app-empty-state')!;
    expect(empty.textContent).toContain('empty.title');
    expect(empty.textContent).toContain('empty.message');
    expect(empty.querySelector('button')?.textContent).toBe('Add');
  });
});
