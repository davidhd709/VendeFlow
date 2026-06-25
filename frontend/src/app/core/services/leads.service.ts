import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { LeadStatus } from '../constants/lead-statuses';
import { CreateLead, ImportLeadRow, ImportResult, Lead, LeadComment, LeadFilters, LeadStatusHistoryEntry } from '../models/lead.model';
import { CreateFollowUp, FollowUp } from '../models/goal.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/leads`;

  getAll(filters: LeadFilters = {}): Observable<PaginatedResponse<Lead>> {
    return this.http.get<PaginatedResponse<Lead>>(this.base, {
      params: buildParams(filters as Record<string, unknown>),
    });
  }

  getById(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/${id}`);
  }

  create(dto: CreateLead): Observable<Lead> {
    return this.http.post<Lead>(this.base, dto);
  }

  importLeads(rows: ImportLeadRow[]): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.base}/import`, { rows });
  }

  assignSeller(id: string, sellerId: string | null): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/${id}/seller`, { sellerId });
  }

  updateStatus(id: string, status: LeadStatus): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/${id}/status`, { status });
  }

  getFollowUps(leadId: string): Observable<FollowUp[]> {
    return this.http.get<FollowUp[]>(`${this.base}/${leadId}/follow-ups`);
  }

  addFollowUp(leadId: string, dto: CreateFollowUp): Observable<FollowUp> {
    return this.http.post<FollowUp>(`${this.base}/${leadId}/follow-ups`, dto);
  }

  getComments(leadId: string): Observable<LeadComment[]> {
    return this.http.get<LeadComment[]>(`${this.base}/${leadId}/comments`);
  }

  addComment(leadId: string, body: string): Observable<LeadComment> {
    return this.http.post<LeadComment>(`${this.base}/${leadId}/comments`, { body });
  }

  getStatusHistory(leadId: string): Observable<LeadStatusHistoryEntry[]> {
    return this.http.get<LeadStatusHistoryEntry[]>(`${this.base}/${leadId}/status-history`);
  }
}
