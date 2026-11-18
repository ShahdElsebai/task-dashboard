import { HttpResponse } from '@angular/common/http';

export interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}
