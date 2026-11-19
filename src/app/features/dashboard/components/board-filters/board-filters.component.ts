import {
  Component,
  computed,
  inject,
  input,
  InputSignal,
  model,
  ModelSignal,
  output,
  OutputEmitterRef,
  Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SelectModule } from '@openng/optimus-ui/select';
import { SelectButtonModule } from '@openng/optimus-ui/selectbutton';

import { UserDto } from '@core/dto';

import { PRIORITY_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from './board-filters.config';
import { FilterOption, FilterSelectOption, PriorityFilter, StatusFilter } from './board-filters.model';

@Component({
  selector: 'app-board-filters',
  imports: [FormsModule, TranslatePipe, ButtonModule, SelectModule, SelectButtonModule],
  templateUrl: './board-filters.component.html',
})
export class BoardFiltersComponent {
  private readonly translate: TranslateService = inject(TranslateService);

  readonly status: ModelSignal<StatusFilter> = model.required<StatusFilter>();
  readonly priority: ModelSignal<PriorityFilter> = model.required<PriorityFilter>();
  readonly assigneeId: ModelSignal<string | null> = model.required<string | null>();
  readonly users: InputSignal<UserDto[]> = input<UserDto[]>([]);

  readonly newTask: OutputEmitterRef<void> = output<void>();

  private readonly labels: Signal<Record<string, string>> = toSignal(
    this.translate.stream(
      [...STATUS_FILTER_OPTIONS, ...PRIORITY_FILTER_OPTIONS].map((o: { labelKey: string }) => o.labelKey)
    ),
    { initialValue: {} }
  );

  protected readonly statusOptions: Signal<FilterSelectOption<StatusFilter>[]> = computed(() =>
    this.translated(STATUS_FILTER_OPTIONS)
  );
  protected readonly priorityOptions: Signal<FilterSelectOption<PriorityFilter>[]> = computed(() =>
    this.translated(PRIORITY_FILTER_OPTIONS)
  );

  private translated<T>(options: readonly FilterOption<T>[]): FilterSelectOption<T>[] {
    const labels: Record<string, string> = this.labels();
    return options.map((o: FilterOption<T>) => ({ label: labels[o.labelKey] ?? o.labelKey, value: o.value }));
  }
}
