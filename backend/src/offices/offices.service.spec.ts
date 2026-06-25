import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { OfficesService } from './offices.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const admin: AuthUser = {
  id: 'admin-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
};

describe('OfficesService', () => {
  let service: OfficesService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new OfficesService(prisma as unknown as PrismaService, auditMock);
  });

  it('findAll aplica filtro tenant por companyId antes de paginar', async () => {
    prisma.office.findMany.mockResolvedValue([] as never);
    prisma.office.count.mockResolvedValue(0 as never);
    prisma.$transaction.mockResolvedValue([[], 0] as never);

    await service.findAll(admin, { page: 1, limit: 20, skip: 0, take: 20 });

    expect(prisma.office.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 'company-A' },
        skip: 0,
        take: 20,
      }),
    );
    expect(prisma.office.count).toHaveBeenCalledWith({
      where: { companyId: 'company-A' },
    });
  });

  it('update guarda address y phone para una oficina del tenant', async () => {
    prisma.office.findFirst.mockResolvedValue({
      id: 'office-1',
      companyId: 'company-A',
    } as never);
    prisma.office.update.mockResolvedValue({
      id: 'office-1',
      companyId: 'company-A',
      name: 'Sede Centro',
      city: 'Bogotá',
      address: 'Calle 123',
      phone: '3001234567',
      isActive: true,
    } as never);

    const result = await service.update(admin, 'office-1', {
      address: 'Calle 123',
      phone: '3001234567',
    });

    expect(prisma.office.findFirst).toHaveBeenCalledWith({
      where: { id: 'office-1', companyId: 'company-A' },
    });
    expect(prisma.office.update).toHaveBeenCalledWith({
      where: { id: 'office-1' },
      data: { address: 'Calle 123', phone: '3001234567' },
    });
    expect(result).toMatchObject({
      address: 'Calle 123',
      phone: '3001234567',
    });
  });

  it('update responde 404 cuando la oficina no pertenece al tenant', async () => {
    prisma.office.findFirst.mockResolvedValue(null as never);

    await expect(
      service.update(admin, 'office-foreign', { address: 'Nueva dirección' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
