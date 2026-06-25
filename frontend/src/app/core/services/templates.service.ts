import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateTemplate, MessageTemplate } from '../models/campaign.model';

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/message-templates`;

  getAll(): Observable<MessageTemplate[]> {
    return this.http.get<MessageTemplate[]>(this.base);
  }

  create(dto: CreateTemplate): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(this.base, dto);
  }

  update(
    id: string,
    dto: Partial<CreateTemplate>,
  ): Observable<MessageTemplate> {
    return this.http.patch<MessageTemplate>(`${this.base}/${id}`, dto);
  }
}
