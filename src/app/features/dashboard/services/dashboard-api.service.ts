import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateTaskDto, StatisticDto, TaskDto, UpdateTaskDto } from '../../../core/dto';
import { TASKS_API_PATH } from '../dashboard.config';

@Service()
export class DashboardApiService {
  private readonly http: HttpClient = inject(HttpClient);

  tasksResource(): HttpResourceRef<TaskDto[]> {
    return httpResource<TaskDto[]>(() => TASKS_API_PATH, { defaultValue: [] });
  }

  statisticsResource(): HttpResourceRef<StatisticDto[]> {
    return httpResource<StatisticDto[]>(() => 'statistics', { defaultValue: [] });
  }

  createTask(body: CreateTaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(TASKS_API_PATH, body);
  }

  updateTask(id: string, changes: UpdateTaskDto): Observable<TaskDto> {
    return this.http.patch<TaskDto>(`${TASKS_API_PATH}/${encodeURIComponent(id)}`, changes);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${TASKS_API_PATH}/${encodeURIComponent(id)}`);
  }
}
