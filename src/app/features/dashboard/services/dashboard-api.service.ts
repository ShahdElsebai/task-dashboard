import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateTaskDto, StatisticDto, TaskDto, UpdateTaskDto } from '../../../core/dto';

const TASKS: string = 'tasks';

@Service()
export class DashboardApiService {
  private readonly http: HttpClient = inject(HttpClient);

  tasksResource(): HttpResourceRef<TaskDto[]> {
    return httpResource<TaskDto[]>(() => TASKS, { defaultValue: [] });
  }

  statisticsResource(): HttpResourceRef<StatisticDto[]> {
    return httpResource<StatisticDto[]>(() => 'statistics', { defaultValue: [] });
  }

  createTask(body: CreateTaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(TASKS, body);
  }

  updateTask(id: string, changes: UpdateTaskDto): Observable<TaskDto> {
    return this.http.patch<TaskDto>(`${TASKS}/${encodeURIComponent(id)}`, changes);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${TASKS}/${encodeURIComponent(id)}`);
  }
}
