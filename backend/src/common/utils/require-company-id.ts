import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../types/auth-user';

/** Garantiza que el usuario pertenece a una empresa (no aplica a SUPERADMIN). */
export function requireCompanyId(user: AuthUser): string {
  if (!user.companyId) {
    throw new ForbiddenException('Acción no disponible para este usuario');
  }
  return user.companyId;
}
