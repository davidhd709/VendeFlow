import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { Role } from '../constants/roles';
import { AuthUser, LoginRequest, LoginResponse } from '../models/user.model';
import { TokenService } from './token.service';

/**
 * Estado de autenticación compartido con Signals.
 * El access token lo guarda TokenService en memoria; el refresh va en cookie httpOnly.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);
  readonly companyId = computed(() => this._user()?.companyId ?? null);
  readonly companyName = computed(() => this._user()?.companyName ?? null);
  readonly mustChangePassword = computed(() => this._user()?.mustChangePassword ?? false);

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/login`, dto, { withCredentials: true })
      .pipe(tap((res) => this.applySession(res)));
  }

  /** Renueva el access token usando la cookie httpOnly del refresh token. */
  refresh(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}/refresh`, {}, { withCredentials: true })
      .pipe(tap((res) => this.applySession(res)));
  }

  me(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.base}/me`)
      .pipe(tap((user) => this._user.set(user)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  setUser(user: AuthUser): void {
    this._user.set(user);
  }

  clearSession(): void {
    this._user.set(null);
    this.tokens.clear();
  }

  private applySession(res: LoginResponse): void {
    this.tokens.setAccessToken(res.accessToken);
    this._user.set(res.user);
  }
}
