import { Role } from '@prisma/client';

/**
 * Identidad autenticada que viaja en req.user tras validar el JWT.
 * El companyId/officeId SIEMPRE se leen de aquí, nunca del body o los params.
 */
export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  companyId: string | null; // null solo para SUPERADMIN
  officeId: string | null;
}
