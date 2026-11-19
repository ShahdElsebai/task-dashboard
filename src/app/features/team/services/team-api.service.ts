import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Service } from '@angular/core';

import { TaskDto } from '@core/dto';

@Service()
export class TeamApiService {
  tasksResource(): HttpResourceRef<TaskDto[]> {
    return httpResource<TaskDto[]>(() => 'tasks', { defaultValue: [] });
  }
}
