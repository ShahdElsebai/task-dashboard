import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import { ActivityDto, ActivityType, UserDto } from '@core/dto';

import { ActivityFeedComponent } from './activity-feed.component';

const TEST_USER: UserDto = { id: 'user-001', name: 'Sarah Smith', avatar: 'SS', email: 'sarah@company.com' };

describe('ActivityFeedComponent', () => {
  let fixture: ComponentFixture<ActivityFeedComponent>;
  const activity = (id: string, type: ActivityType, title: string): ActivityDto => ({
    id,
    type,
    taskId: `task-${id}`,
    taskTitle: title,
    user: TEST_USER,
    timestamp: new Date().toISOString(),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFeedComponent],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(ActivityFeedComponent);
  });

  it('links each task to its edit dialog, except deleted ones', async () => {
    fixture.componentRef.setInput('activities', [
      activity('1', ActivityType.Updated, 'Kept'),
      activity('2', ActivityType.Deleted, 'Gone'),
    ]);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement as HTMLElement;
    const links: HTMLAnchorElement[] = Array.from(host.querySelectorAll('a'));
    expect(links.map((a: HTMLAnchorElement) => a.textContent?.trim())).toEqual(['Kept']);
    expect(links[0].getAttribute('href')).toBe('/dashboard?task=task-1');
    expect(host.querySelector('.line-through')?.textContent).toContain('Gone');
    expect(host.querySelectorAll('time')).toHaveLength(2);
  });

  it('shows an empty message with no activity', async () => {
    fixture.componentRef.setInput('activities', []);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('activity.empty');
  });
});
