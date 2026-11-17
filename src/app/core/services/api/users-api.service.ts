import { type HttpResourceRef, httpResource } from '@angular/common/http';
import { Service } from '@angular/core';

import type { UserDto } from '../../dto';

@Service()
export class UsersApiService {
  listResource(): HttpResourceRef<UserDto[]> {
    return httpResource<UserDto[]>(() => 'users', { defaultValue: [] });
  }
}
