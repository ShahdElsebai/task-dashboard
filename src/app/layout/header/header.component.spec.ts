import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

import { BoardStateService } from '../../features/dashboard/services/board-state.service';
import { HeaderComponent } from './header.component';
import { SEARCH_DEBOUNCE_MS } from './header.config';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let board: BoardStateService;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    board = TestBed.inject(BoardStateService);
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
    expect(board.filters().search).toBe('');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(board.filters().search).toBe('design');
  });

  it('emits menuToggle from the mobile menu button', () => {
    let toggled: boolean = false;
    fixture.componentInstance.menuToggle.subscribe(() => (toggled = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();
    expect(toggled).toBe(true);
  });
});
