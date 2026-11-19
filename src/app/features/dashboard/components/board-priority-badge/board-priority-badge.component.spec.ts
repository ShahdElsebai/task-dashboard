import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { TaskPriority } from '@core/dto';

import { BoardPriorityBadgeComponent } from './board-priority-badge.component';

describe('BoardPriorityBadgeComponent', () => {
  let fixture: ComponentFixture<BoardPriorityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPriorityBadgeComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(BoardPriorityBadgeComponent);
    fixture.componentRef.setInput('priority', TaskPriority.High);
    await fixture.whenStable();
  });

  it('shows the translated label and the matching colour', async () => {
    const badge: HTMLElement = (fixture.nativeElement as HTMLElement).querySelector('span')!;
    expect(badge.textContent?.trim()).toBe('priority.high');
    expect(badge.classList).toContain('text-priority-high');

    fixture.componentRef.setInput('priority', TaskPriority.Low);
    await fixture.whenStable();
    expect(badge.classList).toContain('text-priority-low');
    expect(badge.classList).not.toContain('text-priority-high');
  });
});
