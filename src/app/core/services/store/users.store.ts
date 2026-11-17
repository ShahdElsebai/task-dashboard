import { HttpResourceRef } from '@angular/common/http';
import { Service, Signal, computed, inject } from '@angular/core';

import { UserDto } from '../../dto';
import { UsersApiService } from '../api';

@Service()
export class UsersStore {
  private readonly resource: HttpResourceRef<UserDto[]> = inject(UsersApiService).listResource();

  readonly users: Signal<UserDto[]> = computed(() => this.resource.value());
  readonly isLoading: Signal<boolean> = computed(() => this.resource.isLoading());
  readonly error: Signal<unknown> = computed(() => this.resource.error() ?? null);

  find(id: string): UserDto | undefined {
    return this.users().find((user: UserDto) => user.id === id);
  }

  reload(): void {
    this.resource.reload();
  }
}
