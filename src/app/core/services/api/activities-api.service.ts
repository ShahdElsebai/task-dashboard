import { HttpClient, HttpContext, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { Observable } from 'rxjs';

import { ACTIVITIES_API_PATH } from '../../config/activity.config';
import { ActivityDto, CreateActivityDto } from '../../dto';
import { SKIP_ERROR_TOAST, SKIP_LOADING } from '../http/http-context.tokens';

@Service()
export class ActivitiesApiService {
  private readonly http: HttpClient = inject(HttpClient);

  listResource(): HttpResourceRef<ActivityDto[]> {
    return httpResource<ActivityDto[]>(() => `${ACTIVITIES_API_PATH}?_sort=-timestamp`, { defaultValue: [] });
  }

  create(body: CreateActivityDto): Observable<ActivityDto> {
    const context: HttpContext = new HttpContext().set(SKIP_LOADING, true).set(SKIP_ERROR_TOAST, true);
    return this.http.post<ActivityDto>(ACTIVITIES_API_PATH, body, { context });
  }
}
