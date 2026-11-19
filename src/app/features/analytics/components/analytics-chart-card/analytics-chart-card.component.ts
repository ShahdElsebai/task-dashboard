import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartModule } from '@openng/optimus-ui/chart';
import { ChartData } from 'chart.js';
import { Observable, switchMap } from 'rxjs';

import { LANGUAGES } from '../../../../core/config/i18n.config';
import { LanguageService } from '../../../../core/services/language.service';
import { ChartSlice } from '../../analytics.model';
import { percentOf } from '../../analytics.utils';
import { chartOptions } from './analytics-chart-card.config';
import { ChartKindOptions } from './analytics-chart-card.model';
import { ChartKind, LegendItem } from './analytics-chart-card.model';

@Component({
  selector: 'app-analytics-chart-card',
  imports: [TranslatePipe, ChartModule],
  templateUrl: './analytics-chart-card.component.html',
})
export class AnalyticsChartCardComponent {
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly language: LanguageService = inject(LanguageService);

  readonly titleKey: InputSignal<string> = input.required<string>();
  readonly kind: InputSignal<ChartKind> = input.required<ChartKind>();
  readonly slices: InputSignal<ChartSlice[]> = input.required<ChartSlice[]>();

  private readonly labelKeys: Signal<string[]> = computed(() => this.slices().map((s: ChartSlice) => s.labelKey));
  private readonly labels: Signal<Record<string, string>> = toSignal(
    toObservable(this.labelKeys).pipe(
      switchMap((keys: string[]): Observable<Record<string, string>> => this.translate.stream(keys))
    ),
    { initialValue: {} }
  );

  protected readonly total: Signal<number> = computed(() =>
    this.slices().reduce((sum: number, s: ChartSlice) => sum + s.value, 0)
  );

  protected readonly legend: Signal<LegendItem[]> = computed(() => {
    const labels: Record<string, string> = this.labels();
    const total: number = this.total();
    return this.slices().map((s: ChartSlice) => ({
      label: labels[s.labelKey] ?? s.labelKey,
      value: s.value,
      percent: percentOf(s.value, total),
      swatchClass: `inline-block size-3 shrink-0 rounded-full ${s.swatchClass}`,
    }));
  });

  protected readonly data: Signal<ChartData> = computed(() => ({
    labels: this.legend().map((item: LegendItem) => item.label),
    datasets: [
      {
        data: this.slices().map((s: ChartSlice) => s.value),
        backgroundColor: this.slices().map((s: ChartSlice) => s.color),
        borderRadius: this.kind() === 'bar' ? 6 : 0,
        maxBarThickness: 48,
      },
    ],
  }));

  protected readonly options: Signal<ChartKindOptions> = computed(() =>
    chartOptions(this.kind(), LANGUAGES[this.language.current()].dir === 'rtl')
  );

  protected readonly summary: Signal<string> = computed(() =>
    this.legend()
      .map((item: LegendItem) => `${item.label}: ${item.value}`)
      .join(', ')
  );
}
