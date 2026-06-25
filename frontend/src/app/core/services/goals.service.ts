import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateGoal, Goal } from '../models/goal.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/goals`;

  getAll(year?: number, month?: number): Observable<Goal[]> {
    return this.http.get<Goal[]>(this.base, {
      params: buildParams({ year, month }),
    });
  }

  create(dto: CreateGoal): Observable<Goal> {
    return this.http.post<Goal>(this.base, dto);
  }

  update(
    id: string,
    dto: { targetAmount?: number; targetSales?: number },
  ): Observable<Goal> {
    return this.http.patch<Goal>(`${this.base}/${id}`, dto);
  }
}
