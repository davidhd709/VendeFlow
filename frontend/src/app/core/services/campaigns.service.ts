import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Campaign, CreateCampaign, ReactivationResult, ReactivationType } from '../models/campaign.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/campaigns`;

  getAll(page = 1, limit = 50): Observable<PaginatedResponse<Campaign>> {
    return this.http.get<PaginatedResponse<Campaign>>(this.base, {
      params: buildParams({ page, limit }),
    });
  }

  getById(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.base}/${id}`);
  }

  create(dto: CreateCampaign): Observable<Campaign> {
    return this.http.post<Campaign>(this.base, dto);
  }

  getReactivation(type: ReactivationType): Observable<ReactivationResult> {
    return this.http.get<ReactivationResult>(`${this.base}/reactivation`, {
      params: buildParams({ type }),
    });
  }
}
