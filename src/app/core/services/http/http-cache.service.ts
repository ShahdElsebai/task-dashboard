import { HttpResponse } from '@angular/common/http';
import { Service } from '@angular/core';
import { CACHE_TTL_MS } from '../../config/http.config';
import { CacheEntry } from '../../models/http-cache.model';

@Service()
export class HttpCacheService {
  private readonly entries: Map<string, CacheEntry> = new Map<string, CacheEntry>();

  get(key: string, now: number = Date.now()): HttpResponse<unknown> | null {
    const entry: CacheEntry | undefined = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return null;
    }
    return entry.response;
  }

  set(key: string, response: HttpResponse<unknown>, now: number = Date.now()): void {
    this.entries.set(key, { response, expiresAt: now + CACHE_TTL_MS });
  }

  invalidate(url: string): void {
    const collection: string = collectionOf(url);
    for (const key of this.entries.keys()) {
      if (collectionOf(key) === collection) this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export function collectionOf(url: string): string {
  const path: string = url.split('?')[0].replace(/\/+$/, '');
  const match: RegExpMatchArray | null = path.match(/^(.*?\/api\/[^/]+)/);
  return match ? match[1] : path;
}
