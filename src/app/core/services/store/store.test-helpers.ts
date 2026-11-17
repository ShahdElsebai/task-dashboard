import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, type TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, type EnvironmentProviders, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TaskPriority, TaskStatus, type TaskDto, type UserDto } from '../../dto';
import { apiUrlInterceptor } from '../http/api-url.interceptor';
import { NotificationService } from '../notification.service';

export const TEST_USER: UserDto = { id: 'user-1', name: 'John Doe', avatar: 'JD', email: 'j@x.com' };

export function makeTask(id: string, status: TaskStatus, position: number, overrides: Partial<TaskDto> = {}): TaskDto {
  return {
    id,
    title: `Task ${id}`,
    description: '',
    status,
    priority: TaskPriority.Medium,
    dueDate: '2099-01-01',
    completedAt: status === TaskStatus.Done ? '2026-01-01T00:00:00.000Z' : null,
    assignee: TEST_USER,
    position,
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export interface NotificationsMock {
  error: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
}

export function storeTestProviders(notifications: NotificationsMock): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withInterceptors([apiUrlInterceptor])),
    provideHttpClientTesting(),
    { provide: NotificationService, useValue: notifications },
  ];
}

/** Answers the initial GETs of every store that has been created, then waits for the resources. */
export async function flushInitialLoad(http: HttpTestingController, tasks: TaskDto[]): Promise<void> {
  TestBed.tick();
  http.match('/api/tasks').forEach((req: TestRequest) => req.flush(tasks));
  http.match('/api/users').forEach((req: TestRequest) => req.flush([TEST_USER]));
  http.match('/api/activities?_sort=-timestamp').forEach((req: TestRequest) => req.flush([]));
  await TestBed.inject(ApplicationRef).whenStable();
}

/** Answers background activity POSTs, if any. */
export function flushActivities(http: HttpTestingController): void {
  http.match('/api/activities').forEach((req: TestRequest) => req.flush({ ...req.request.body, id: 'a' }));
}
