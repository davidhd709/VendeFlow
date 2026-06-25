import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AlertItem } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/alerts`;

  getAll(): Observable<AlertItem[]> {
    return this.http.get<AlertItem[]>(this.base);
  }
}
