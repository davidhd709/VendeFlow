import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

/** Elimina passwordHash antes de devolver un usuario en cualquier response. */
export function sanitizeUser(user: User): SafeUser {
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  return safe;
}
