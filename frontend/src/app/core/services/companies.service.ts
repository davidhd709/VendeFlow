import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Company, CompanyUser, CreateCompany, CreateCompanyResponse, GlobalMetrics, ResetAdminPasswordResponse, SetupStatus } from '../models/company.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/companies`;

  getAll(page = 1, limit = 50): Observable<PaginatedResponse<Company>> {
    return this.http.get<PaginatedResponse<Company>>(this.base, {
      params: buildParams({ page, limit }),
    });
  }

  create(dto: CreateCompany): Observable<CreateCompanyResponse> {
    return this.http.post<CreateCompanyResponse>(this.base, dto);
  }

  resetAdminPassword(companyId: string): Observable<ResetAdminPasswordResponse> {
    return this.http.post<ResetAdminPasswordResponse>(`${this.base}/${companyId}/reset-admin-password`, {});
  }

  update(id: string, dto: { name?: string; slug?: string; subdomain?: string }): Observable<Company> {
    return this.http.patch<Company>(`${this.base}/${id}`, dto);
  }

  updateStatus(id: string, status: string): Observable<Company> {
    return this.http.patch<Company>(`${this.base}/${id}/status`, { status });
  }

  getGlobalMetrics(): Observable<GlobalMetrics> {
    return this.http.get<GlobalMetrics>(`${this.base}/metrics`);
  }

  getCompanyUsers(companyId: string): Observable<CompanyUser[]> {
    return this.http.get<CompanyUser[]>(`${this.base}/${companyId}/users`);
  }

  getSetupStatus(): Observable<SetupStatus> {
    return this.http.get<SetupStatus>(`${this.base}/my/setup-status`);
  }
}
