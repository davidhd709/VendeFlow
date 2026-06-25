import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface AppNotification {
  id: string;
  type: 'COMMENT_ADDED' | 'FOLLOWUP_ADDED' | 'LEAD_ASSIGNED';
  title: string;
  body: string;
  leadId: string | null;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  getAll(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.base);
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.base}/read-all`, {});
  }

  markOneRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/read`, {});
  }
}
