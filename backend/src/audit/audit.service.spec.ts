import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AuditService(prisma as unknown as PrismaService);
  });

  it('crea un registro de auditoría con los campos correctos', async () => {
    prisma.auditLog.create.mockResolvedValue({} as never);

    await service.record({
      companyId: 'company-A',
      actorId: 'user-1',
      actorRole: Role.ADMIN,
      action: 'sale.registered',
      targetId: 'sale-1',
      targetType: 'Sale',
      ip: '127.0.0.1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'company-A',
        actorId: 'user-1',
        actorRole: Role.ADMIN,
        action: 'sale.registered',
        targetId: 'sale-1',
        targetType: 'Sale',
        ip: '127.0.0.1',
      }),
    });
  });

  it('acepta campos opcionales nulos sin lanzar error', async () => {
    prisma.auditLog.create.mockResolvedValue({} as never);

    await expect(
      service.record({ action: 'company.created' }),
    ).resolves.toBeUndefined();

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: null, actorId: null, action: 'company.created' }),
    });
  });

  it('usa el cliente de transacción cuando se proporciona', async () => {
    const txClient = createPrismaMock();
    txClient.auditLog.create.mockResolvedValue({} as never);

    await service.record(
      { action: 'user.created', companyId: 'company-A' },
      txClient as never,
    );

    expect(txClient.auditLog.create).toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('no lanza error si el insert falla (silencia el error)', async () => {
    prisma.auditLog.create.mockRejectedValue(new Error('DB error'));

    await expect(
      service.record({ action: 'sale.registered', companyId: 'c-a' }),
    ).resolves.toBeUndefined();
  });
});
