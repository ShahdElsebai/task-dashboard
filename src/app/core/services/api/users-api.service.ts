import { type HttpResourceRef, httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

import type { UserDto } from '../../dto';

/** Read-only client for `/users` (mock team members). */
@Service()
export class UsersApiService {
  listResource(): HttpResourceRef<UserDto[]> {
    return httpResource<UserDto[]>(() => 'users', { defaultValue: [] });
  }
}
