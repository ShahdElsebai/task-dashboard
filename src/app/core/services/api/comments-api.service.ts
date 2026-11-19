import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { Observable } from 'rxjs';

import { COMMENTS_API_PATH } from '../../config/comment.config';
import { CommentDto, CreateCommentDto } from '../../dto';

@Service()
export class CommentsApiService {
  private readonly http: HttpClient = inject(HttpClient);

  /** Every comment, oldest first. One list serves both the task dialog and the notifications menu. */
  listResource(): HttpResourceRef<CommentDto[]> {
    return httpResource<CommentDto[]>(() => `${COMMENTS_API_PATH}?_sort=createdAt`, { defaultValue: [] });
  }

  create(body: CreateCommentDto): Observable<CommentDto> {
    return this.http.post<CommentDto>(COMMENTS_API_PATH, body);
  }
}
