import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateOffice, Office } from '../models/catalog.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class OfficesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/offices`;

  getAll(page = 1, limit = 100): Observable<PaginatedResponse<Office>> {
    return this.http.get<PaginatedResponse<Office>>(this.base, {
      params: buildParams({ page, limit }),
    });
  }

  create(dto: CreateOffice): Observable<Office> {
    return this.http.post<Office>(this.base, dto);
  }

  update(id: string, dto: Partial<CreateOffice>): Observable<Office> {
    return this.http.patch<Office>(`${this.base}/${id}`, dto);
  }
}
