import { Prisma } from '@prisma/client';
import { BusinessError } from '../errors/business-error';

export function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** Convierte una violación de constraint único en un 409, o re-lanza el error. */
export function throwOnDuplicate(
  error: unknown,
  message: string,
  field?: string,
): never {
  if (isUniqueConstraintError(error)) {
    throw new BusinessError(409, message, 'CONFLICT', field);
  }
  throw error;
}
