import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateUser, CreateUserResponse, ManagedUser, ResetPasswordResponse, UpdateUser } from '../models/user.model';
import { PaginatedResponse } from '../models/paginated.model';
import { buildParams } from '../utils/build-params';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private static readonly MAX_LIMIT = 200;
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  getAll(page = 1, limit = 50): Observable<PaginatedResponse<ManagedUser>> {
    const safeLimit = Math.max(1, Math.min(UsersService.MAX_LIMIT, Math.floor(limit)));
    return this.http.get<PaginatedResponse<ManagedUser>>(this.base, {
      params: buildParams({ page, limit: safeLimit }),
    });
  }

  /** Vendedores visibles para el usuario actual (ADMIN: todos; COORDINADOR: los suyos). */
  getSellers(officeId?: string): Observable<PaginatedResponse<ManagedUser>> {
    const params: Record<string, unknown> = { role: 'VENDEDOR', limit: 200 };
    if (officeId) params['officeId'] = officeId;
    return this.http.get<PaginatedResponse<ManagedUser>>(this.base, {
      params: buildParams(params),
    });
  }

  /** Crea un usuario — el backend genera la contraseña temporal. */
  create(dto: CreateUser): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.base, dto);
  }

  update(id: string, dto: UpdateUser): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.base}/${id}`, dto);
  }

  /** Restablece la contraseña de un usuario — el backend genera una nueva contraseña temporal. */
  resetPassword(id: string): Observable<ResetPasswordResponse> {
    return this.http.patch<ResetPasswordResponse>(`${this.base}/${id}/password`, {});
  }

  updateStatus(id: string, isActive: boolean): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.base}/${id}/status`, { isActive });
  }

  // Asignación de vendedores a un coordinador.
  getAssignedSellers(coordinatorId: string): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(`${this.base}/${coordinatorId}/sellers`);
  }

  assignSeller(coordinatorId: string, sellerId: string): Observable<unknown> {
    return this.http.post(`${this.base}/${coordinatorId}/sellers`, { sellerId });
  }

  unassignSeller(coordinatorId: string, sellerId: string): Observable<unknown> {
    return this.http.delete(
      `${this.base}/${coordinatorId}/sellers/${sellerId}`,
    );
  }

  // Asignación de oficinas a un coordinador.
  getCoordinatorOffices(coordinatorId: string): Observable<{ id: string; name: string; city: string | null; isActive: boolean }[]> {
    return this.http.get<{ id: string; name: string; city: string | null; isActive: boolean }[]>(
      `${this.base}/${coordinatorId}/offices`,
    );
  }

  assignOffice(coordinatorId: string, officeId: string): Observable<unknown> {
    return this.http.post(`${this.base}/${coordinatorId}/offices`, { officeId });
  }

  unassignOffice(coordinatorId: string, officeId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${coordinatorId}/offices/${officeId}`);
  }

  changeMyPassword(currentPassword: string, newPassword: string): Observable<{ success: true }> {
    return this.http.patch<{ success: true }>(
      `${environment.apiUrl}/auth/me/password`,
      { currentPassword, newPassword },
    );
  }

  /** Cambia la contraseña temporal forzada sin requerir la contraseña actual. */
  forceChangePassword(newPassword: string): Observable<{ success: true }> {
    return this.http.patch<{ success: true }>(
      `${environment.apiUrl}/auth/me/force-change-password`,
      { newPassword },
    );
  }
}
