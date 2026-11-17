import { type HttpResourceRef, httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

import type { StatisticDto } from '../../dto';

/**
 * Read-only client for `/statistics`.
 * The dashboard derives live numbers from tasks; this endpoint provides the
 * card metadata (icon, colour, change label) from the provided mock API.
 */
@Service()
export class StatisticsApiService {
  listResource(): HttpResourceRef<StatisticDto[]> {
    return httpResource<StatisticDto[]>(() => 'statistics', { defaultValue: [] });
  }
}
