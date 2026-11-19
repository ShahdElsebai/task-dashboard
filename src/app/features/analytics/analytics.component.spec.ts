import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Component, DebugElement, input, InputSignal } from '@angular/core';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import { TaskPriority, TaskStatus } from '@core/dto';
import { makeTask, NotificationsMock, storeTestProviders, TEST_USER } from '@testing';

import { AnalyticsComponent } from './analytics.component';
import { ChartSlice } from './analytics.model';
import { AnalyticsChartCardComponent } from './components/analytics-chart-card/analytics-chart-card.component';

@Component({ selector: 'app-analytics-chart-card', template: '' })
class ChartCardStub {
  readonly titleKey: InputSignal<string> = input<string>('');
  readonly kind: InputSignal<string> = input<string>('');
  readonly slices: InputSignal<ChartSlice[]> = input<ChartSlice[]>([]);
}

describe('AnalyticsComponent', () => {
  const notifications: NotificationsMock = { error: vi.fn(), success: vi.fn() };
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.overrideComponent(AnalyticsComponent, {
      remove: { imports: [AnalyticsChartCardComponent] },
      add: { imports: [ChartCardStub] },
    });
    TestBed.configureTestingModule({
      providers: [...storeTestProviders(notifications), provideRouter([]), provideTranslateService()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  let fixture: ComponentFixture<AnalyticsComponent>;

  async function render(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(AnalyticsComponent);
    fixture.detectChanges();
    TestBed.tick();
    http
      .match('/api/tasks')
      .forEach((r: TestRequest) =>
        r.flush([
          makeTask('a', TaskStatus.Todo, 1000, { priority: TaskPriority.High }),
          makeTask('b', TaskStatus.Done, 1000),
        ])
      );
    http.match('/api/activities?_sort=-timestamp').forEach((r: TestRequest) =>
      r.flush(
        Array.from({ length: 15 }, (_: unknown, i: number) => ({
          id: `act-${i}`,
          type: 'updated',
          taskId: 'a',
          taskTitle: `Task ${i}`,
          user: TEST_USER,
          timestamp: new Date().toISOString(),
        }))
      )
    );
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('passes the status and priority counts to the two charts', async () => {
    await render();
    const charts: ChartCardStub[] = fixture.debugElement
      .queryAll(By.directive(ChartCardStub))
      .map((d: DebugElement) => d.componentInstance as ChartCardStub);
    const counts = (c: ChartCardStub): number[] => c.slices().map((s: ChartSlice) => s.value);
    expect(charts.map((c: ChartCardStub) => c.kind())).toEqual(['doughnut', 'bar']);
    expect(counts(charts[0])).toEqual([1, 0, 1]);
    expect(counts(charts[1])).toEqual([1, 1, 0]);
  });

  it('shows the 10 most recent activities', async () => {
    const host: HTMLElement = await render();
    expect(host.querySelectorAll('app-activity-feed li')).toHaveLength(10);
  });

  it('shows the error state when tasks fail to load', async () => {
    fixture = TestBed.createComponent(AnalyticsComponent);
    fixture.detectChanges();
    TestBed.tick();
    http.match('/api/tasks').forEach((r: TestRequest) => r.flush('down', { status: 500, statusText: 'Error' }));
    http.match('/api/activities?_sort=-timestamp').forEach((r: TestRequest) => r.flush([]));
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-error-state')).not.toBeNull();
  });
});
