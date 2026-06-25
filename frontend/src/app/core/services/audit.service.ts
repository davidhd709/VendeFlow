import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuditLog } from '../models/audit-log.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

export interface AuditFilters {
  action?: string;
  targetType?: string;
  actorId?: string;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit`;

  getAll(filters: AuditFilters = {}): Observable<PaginatedResponse<AuditLog>> {
    return this.http.get<PaginatedResponse<AuditLog>>(this.base, {
      params: buildParams(filters as Record<string, unknown>),
    });
  }

  getGlobal(filters: AuditFilters = {}): Observable<PaginatedResponse<AuditLog>> {
    return this.http.get<PaginatedResponse<AuditLog>>(`${this.base}/global`, {
      params: buildParams(filters as Record<string, unknown>),
    });
  }
}
