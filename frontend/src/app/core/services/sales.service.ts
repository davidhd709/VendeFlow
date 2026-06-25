import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PaginatedResponse } from '../models/paginated.model';
import { CreateSale, Sale, SaleFilters } from '../models/sale.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sales`;

  getAll(filters: SaleFilters = {}): Observable<PaginatedResponse<Sale>> {
    return this.http.get<PaginatedResponse<Sale>>(this.base, {
      params: buildParams(filters as Record<string, unknown>),
    });
  }

  register(dto: CreateSale): Observable<Sale> {
    return this.http.post<Sale>(this.base, dto);
  }

  exportCsv(filters: SaleFilters = {}): Observable<Blob> {
    return this.http.get(`${this.base}/export`, {
      params: buildParams(filters as Record<string, unknown>),
      responseType: 'blob',
    });
  }
}
