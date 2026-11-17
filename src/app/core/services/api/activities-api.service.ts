import { HttpClient, HttpContext, type HttpResourceRef, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ActivityDto, CreateActivityDto } from '../../dto';
import { SKIP_ERROR_TOAST, SKIP_LOADING } from '../http/http-context.tokens';

const PATH: string = 'activities';

/** REST client for `/activities` (recent activity feed). */
@Service()
export class ActivitiesApiService {
  private readonly http: HttpClient = inject(HttpClient);

  /**
   * Newest first. json-server v1 ignores `_limit` when sorting,
   * so the store caps the list client-side.
   */
  listResource(): HttpResourceRef<ActivityDto[]> {
    return httpResource<ActivityDto[]>(() => `${PATH}?_sort=-timestamp`, { defaultValue: [] });
  }

  /** Background write: no spinner and no toast if it fails, since the feed is non-critical. */
  create(body: CreateActivityDto): Observable<ActivityDto> {
    const context: HttpContext = new HttpContext().set(SKIP_LOADING, true).set(SKIP_ERROR_TOAST, true);
    return this.http.post<ActivityDto>(PATH, body, { context });
  }
}
