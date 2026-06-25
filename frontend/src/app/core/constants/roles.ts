// Espejo del enum Role del backend (Prisma). Fuente de verdad: salesflow-domain.
export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  COORDINADOR = 'COORDINADOR',
  VENDEDOR = 'VENDEDOR',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPERADMIN]: 'Superadministrador',
  [Role.ADMIN]: 'Administrador',
  [Role.COORDINADOR]: 'Coordinador',
  [Role.VENDEDOR]: 'Vendedor',
};

/** Ruta del panel por defecto según el rol autenticado. */
export const ROLE_HOME: Record<Role, string> = {
  [Role.SUPERADMIN]: '/superadmin',
  [Role.ADMIN]: '/admin',
  [Role.COORDINADOR]: '/coordinador',
  [Role.VENDEDOR]: '/vendedor',
};
