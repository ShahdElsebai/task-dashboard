import { HttpClient, HttpContext, type HttpResourceRef, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ActivityDto, CreateActivityDto } from '../../dto';
import { SKIP_ERROR_TOAST, SKIP_LOADING } from '../http/http-context.tokens';

const PATH: string = 'activities';

@Service()
export class ActivitiesApiService {
  private readonly http: HttpClient = inject(HttpClient);

  // json-server v1 ignores _limit when sorting, so the store caps the list.
  listResource(): HttpResourceRef<ActivityDto[]> {
    return httpResource<ActivityDto[]>(() => `${PATH}?_sort=-timestamp`, { defaultValue: [] });
  }

  create(body: CreateActivityDto): Observable<ActivityDto> {
    const context: HttpContext = new HttpContext().set(SKIP_LOADING, true).set(SKIP_ERROR_TOAST, true);
    return this.http.post<ActivityDto>(PATH, body, { context });
  }
}
