import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../constants/roles';
import { AuthService } from './auth.service';

/** Restringe una ruta a ciertos roles (solo UX; la seguridad la impone el backend). */
export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();

    if (!role || !allowedRoles.includes(role)) {
      router.navigate(['/403']);
      return false;
    }
    return true;
  };
};
