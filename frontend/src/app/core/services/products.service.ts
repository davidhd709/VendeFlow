import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateProduct, Product } from '../models/catalog.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;

  getAll(page = 1, limit = 20, search?: string): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(this.base, {
      params: buildParams({ page, limit, search }),
    });
  }

  create(dto: CreateProduct): Observable<Product> {
    return this.http.post<Product>(this.base, dto);
  }

  update(id: string, dto: Partial<CreateProduct>): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/${id}`, dto);
  }
}
