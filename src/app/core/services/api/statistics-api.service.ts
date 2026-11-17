import { type HttpResourceRef, httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

import type { StatisticDto } from '../../dto';

// Live numbers come from tasks; this endpoint only provides card metadata (icon, colour, change label).
@Service()
export class StatisticsApiService {
  listResource(): HttpResourceRef<StatisticDto[]> {
    return httpResource<StatisticDto[]>(() => 'statistics', { defaultValue: [] });
  }
}
