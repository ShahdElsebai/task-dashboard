import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptors that stand in for the backend.
 *
 * Empty in every build except `demo`, where `angular.json` replaces this file with
 * `mock-backend.providers.demo.ts`. The mock and its seed data therefore never reach the
 * development, production or Docker builds.
 */
export const MOCK_BACKEND_INTERCEPTORS: HttpInterceptorFn[] = [];
