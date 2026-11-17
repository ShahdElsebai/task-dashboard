import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorStateComponent);
  });

  it('shows the message key and emits retry on click', async () => {
    let retried: boolean = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    await fixture.whenStable();

    const host: HTMLElement = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('errors.loadFailed');
    host.querySelector('button')?.click();
    expect(retried).toBe(true);
  });

  it('hides the retry button when not retryable', async () => {
    fixture.componentRef.setInput('retryable', false);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
