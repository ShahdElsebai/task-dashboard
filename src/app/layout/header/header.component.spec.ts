import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

import { SearchService } from '@core/services/search.service';

import { HeaderComponent } from './header.component';
import { SEARCH_DEBOUNCE_MS } from './header.config';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let search: SearchService;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: 'dashboard', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    search = TestBed.inject(SearchService);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  const type = (value: string): void => {
    const input: HTMLInputElement = (fixture.nativeElement as HTMLElement).querySelector('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('updates the search filter after the debounce, only with the last value', () => {
    type('d');
    type('design');
    expect(search.query()).toBe('');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(search.query()).toBe('design');
  });

  it('opens the dashboard when searching from another page', () => {
    const navigate: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    type('budget');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(navigate).toHaveBeenCalledWith(['/dashboard'], { queryParams: { q: 'budget' } });
  });

  it('emits menuToggle from the mobile menu button', () => {
    let toggled: boolean = false;
    fixture.componentInstance.menuToggle.subscribe(() => (toggled = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
    expect(toggled).toBe(true);
  });
});
