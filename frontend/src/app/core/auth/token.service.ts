import { Injectable, signal } from '@angular/core';

/**
 * Guarda el access token SOLO en memoria (decisión de seguridad aprobada).
 * El refresh token vive en una cookie httpOnly que JS no puede leer.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _accessToken = signal<string | null>(null);

  getAccessToken(): string | null {
    return this._accessToken();
  }

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
  }

  clear(): void {
    this._accessToken.set(null);
  }
}
