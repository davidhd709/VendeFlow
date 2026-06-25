import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PaginatedResponse } from '../models/paginated.model';
import { CreateTask, Task } from '../models/task.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tasks`;

  getAll(status?: string): Observable<PaginatedResponse<Task>> {
    return this.http.get<PaginatedResponse<Task>>(this.base, {
      params: buildParams({ status, limit: 100 }),
    });
  }

  create(dto: CreateTask): Observable<Task> {
    return this.http.post<Task>(this.base, dto);
  }

  update(
    id: string,
    dto: { status?: string; title?: string; dueDate?: string },
  ): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/${id}`, dto);
  }

  getByLead(leadId: string): Observable<(Task & { assignedTo: { id: string; name: string } | null })[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/leads/${leadId}/tasks`);
  }
}
