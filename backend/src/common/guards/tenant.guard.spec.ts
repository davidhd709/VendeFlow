import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { mockExecutionContext } from '../../../test/helpers/mock-execution-context';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('permite a SUPERADMIN sin importar el companyId del param', () => {
    const ctx = mockExecutionContext(
      { role: Role.SUPERADMIN, companyId: null },
      { companyId: 'cualquiera' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite a ADMIN cuando el param companyId coincide con su empresa', () => {
    const ctx = mockExecutionContext(
      { role: Role.ADMIN, companyId: 'company-A' },
      { companyId: 'company-A' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('bloquea cuando el companyId del param pertenece a otra empresa', () => {
    const ctx = mockExecutionContext(
      { role: Role.ADMIN, companyId: 'company-A' },
      { companyId: 'company-B' },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('bloquea cuando no hay usuario autenticado', () => {
    const ctx = mockExecutionContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
