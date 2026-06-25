import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { mockExecutionContext } from '../../../test/helpers/mock-execution-context';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const makeGuard = (required: Role[] | undefined): RolesGuard => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('permite el acceso cuando el handler no declara roles', () => {
    const guard = makeGuard(undefined);
    const ctx = mockExecutionContext({ role: Role.VENDEDOR });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite cuando el rol del usuario está autorizado', () => {
    const guard = makeGuard([Role.ADMIN, Role.COORDINADOR]);
    const ctx = mockExecutionContext({ role: Role.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lanza Forbidden cuando el rol no está autorizado', () => {
    const guard = makeGuard([Role.ADMIN]);
    const ctx = mockExecutionContext({ role: Role.VENDEDOR });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lanza Forbidden cuando no hay usuario', () => {
    const guard = makeGuard([Role.ADMIN]);
    const ctx = mockExecutionContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
