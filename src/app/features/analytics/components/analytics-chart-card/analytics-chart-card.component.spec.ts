import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { ChartSlice } from '../../analytics.model';
import { AnalyticsChartCardComponent } from './analytics-chart-card.component';
import { LegendItem } from './analytics-chart-card.model';

interface ChartCardInternals {
  legend: () => LegendItem[];
  summary: () => string;
  total: () => number;
  options: () => { scales?: { x?: { reverse?: boolean } } };
}

describe('AnalyticsChartCardComponent', () => {
  const slices: ChartSlice[] = [
    { labelKey: 'a', value: 3, color: '#000', swatchClass: 'bg-a' },
    { labelKey: 'b', value: 1, color: '#fff', swatchClass: 'bg-b' },
  ];

  function create(kind: 'doughnut' | 'bar'): ChartCardInternals {
    TestBed.overrideComponent(AnalyticsChartCardComponent, { set: { template: '', imports: [] } });
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(AnalyticsChartCardComponent);
    fixture.componentRef.setInput('titleKey', 'title');
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('slices', slices);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as ChartCardInternals;
  }

  it('builds the legend with percentages', () => {
    const card: ChartCardInternals = create('doughnut');
    expect(card.total()).toBe(4);
    expect(card.legend()).toEqual([
      { label: 'a', value: 3, percent: 75, swatchClass: 'inline-block size-3 shrink-0 rounded-full bg-a' },
      { label: 'b', value: 1, percent: 25, swatchClass: 'inline-block size-3 shrink-0 rounded-full bg-b' },
    ]);
  });

  it('describes the data for screen readers', () => {
    expect(create('doughnut').summary()).toBe('a: 3, b: 1');
  });

  it('mirrors bar charts in Arabic', () => {
    const card: ChartCardInternals = create('bar');
    expect(card.options().scales?.x?.reverse).toBeFalsy();
    TestBed.inject(LanguageService).current.set('ar');
    expect(card.options().scales?.x?.reverse).toBe(true);
    TestBed.inject(LanguageService).current.set('en');
  });
});
