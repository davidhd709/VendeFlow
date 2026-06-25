import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../auth/token.service';

/** Adjunta el access token a las llamadas autenticadas (no a /public/ ni al login). */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getAccessToken();
  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  if (token && !req.url.includes('/public/') && !isAuthCall) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
