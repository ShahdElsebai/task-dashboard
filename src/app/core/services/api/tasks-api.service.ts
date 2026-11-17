import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateTaskDto, TaskDto, UpdateTaskDto } from '../../dto';

const PATH: string = 'tasks';

@Service()
export class TasksApiService {
  private readonly http: HttpClient = inject(HttpClient);

  // Call from an injection context (field initializer).
  listResource(): HttpResourceRef<TaskDto[]> {
    return httpResource<TaskDto[]>(() => PATH, { defaultValue: [] });
  }

  create(body: CreateTaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(PATH, body);
  }

  update(id: string, changes: UpdateTaskDto): Observable<TaskDto> {
    return this.http.patch<TaskDto>(`${PATH}/${encodeURIComponent(id)}`, changes);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${PATH}/${encodeURIComponent(id)}`);
  }
}
