import { HttpContextToken } from '@angular/common/http';

export const SKIP_LOADING: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);

export const SKIP_CACHE: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);

export const SKIP_ERROR_TOAST: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);
