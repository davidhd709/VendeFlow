import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiError } from '../models/api-error.model';

/** Normaliza errores a ApiError con userMessage y maneja 401/403. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = (error.error ?? {}) as ApiError;
      const userMessage = apiError.message ?? 'Ocurrió un error inesperado';

      const isRefresh = req.url.includes('/auth/refresh');
      const isPublic  = req.url.includes('/public/');

      if (error.status === 401) {
        auth.clearSession();
        // Solo redirige a login si es una llamada autenticada (no refresh ni rutas públicas).
        // Un 401 en /auth/refresh significa que la cookie expiró — simplemente limpiamos la sesión.
        if (!isRefresh && !isPublic) {
          router.navigate(['/auth/login']);
        }
      } else if (error.status === 403 && !isPublic) {
        router.navigate(['/403']);
      }

      return throwError(() => ({ ...apiError, userMessage }));
    }),
  );
};
