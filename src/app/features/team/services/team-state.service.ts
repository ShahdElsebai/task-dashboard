import { HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal } from '@angular/core';

import { TaskDto } from '@core/dto';
import { UsersStore } from '@core/services/store';
import { valueOr } from '@core/utils';

import { TeamMember } from '../team.model';
import { toTeamMembers } from '../team.utils';
import { TeamApiService } from './team-api.service';

/**
 * Provided by the page component, not in root: each visit creates a new resource, so the page
 * reflects changes made on the board since the last visit (the HTTP cache is cleared by writes).
 */
@Service({ autoProvided: false })
export class TeamStateService {
  private readonly users: UsersStore = inject(UsersStore);
  private readonly tasks: HttpResourceRef<TaskDto[]> = inject(TeamApiService).tasksResource();

  readonly members: Signal<TeamMember[]> = computed(() => toTeamMembers(this.users.users(), valueOr(this.tasks, [])));
  readonly isLoading: Signal<boolean> = computed(
    () => (this.users.isLoading() || this.tasks.isLoading()) && !this.members().length
  );
  readonly error: Signal<unknown> = computed(() => this.tasks.error() ?? this.users.error() ?? null);

  reload(): void {
    this.tasks.reload();
    this.users.reload();
  }
}
