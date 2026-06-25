import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CompanyMetrics,
  CoordinatorMetrics,
  SellerMetrics,
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/analytics`;

  company(): Observable<CompanyMetrics> {
    return this.http.get<CompanyMetrics>(`${this.base}/company`);
  }

  me(): Observable<SellerMetrics> {
    return this.http.get<SellerMetrics>(`${this.base}/me`);
  }

  seller(sellerId: string): Observable<SellerMetrics> {
    return this.http.get<SellerMetrics>(`${this.base}/seller/${sellerId}`);
  }

  coordinator(): Observable<CoordinatorMetrics> {
    return this.http.get<CoordinatorMetrics>(`${this.base}/coordinator`);
  }
}
