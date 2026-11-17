import { HttpContextToken } from '@angular/common/http';

/** Don't count this request in the global loading indicator (background refreshes). */
export const SKIP_LOADING: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);

/** Always hit the network for this GET; don't read or write the cache. */
export const SKIP_CACHE: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);

/** Don't show a toast when this request fails; the caller shows the error inline. */
export const SKIP_ERROR_TOAST: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);
