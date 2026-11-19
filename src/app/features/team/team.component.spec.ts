import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { TaskStatus } from '../../core/dto';
import {
  NotificationsMock,
  TEST_USER,
  makeTask,
  storeTestProviders,
} from '../dashboard/services/dashboard.test-helpers';
import { TeamComponent } from './team.component';

describe('TeamComponent', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let http: HttpTestingController;
  let fixture: ComponentFixture<TeamComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...storeTestProviders(notifications), provideRouter([]), provideTranslateService()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TeamComponent);
    fixture.detectChanges();
    TestBed.tick();
  });

  async function settle(): Promise<HTMLElement> {
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows a card per user with their workload and a link to their tasks', async () => {
    http.expectOne('/api/users').flush([TEST_USER]);
    http.expectOne('/api/tasks').flush([makeTask('a', TaskStatus.Todo, 1000), makeTask('b', TaskStatus.Done, 1000)]);
    const host: HTMLElement = await settle();

    const cards: NodeListOf<Element> = host.querySelectorAll('app-team-member-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain(TEST_USER.name);
    expect(cards[0].textContent).toContain('50%');
    expect(cards[0].querySelector('a[href^="/dashboard"]')?.getAttribute('href')).toBe(
      `/dashboard?assignee=${TEST_USER.id}`
    );
  });

  it('shows the error state when tasks fail to load', async () => {
    http.expectOne('/api/users').flush([TEST_USER]);
    http.expectOne('/api/tasks').flush('down', { status: 500, statusText: 'Error' });
    const host: HTMLElement = await settle();
    expect(host.querySelector('app-error-state')).not.toBeNull();
  });
});
