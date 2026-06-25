import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Bloquea el acceso a cualquier ruta protegida si el usuario tiene
 * mustChangePassword === true. Lo redirige a la pantalla de cambio forzado.
 */
export const mustChangePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/auth/change-password']);
  }
  return true;
};
