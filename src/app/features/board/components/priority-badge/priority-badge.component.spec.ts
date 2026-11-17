import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { TaskPriority } from '../../../../core/dto';
import { PriorityBadgeComponent } from './priority-badge.component';

describe('PriorityBadgeComponent', () => {
  let fixture: ComponentFixture<PriorityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriorityBadgeComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(PriorityBadgeComponent);
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
