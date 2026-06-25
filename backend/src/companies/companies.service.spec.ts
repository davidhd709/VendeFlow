import { NotFoundException } from '@nestjs/common';
import { CompanyStatus, Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from './companies.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const pagination = { page: 1, limit: 20, skip: 0, take: 20 } as never;

const superAdmin: AuthUser = {
  id: 'superadmin-1',
  username: 'superadmin',
  role: Role.SUPERADMIN,
  companyId: null,
  officeId: null,
};

const makeCompany = (overrides: Record<string, unknown> = {}) => ({
  id: 'company-1',
  name: 'Empresa Test',
  slug: 'empresa-test',
  subdomain: 'empresa-test',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (arg: unknown) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg as Promise<unknown>[])),
    );
    service = new CompaniesService(prisma as unknown as PrismaService, auditMock);
    (auditMock.record as jest.Mock).mockClear();
  });

  // ─── findAll ──────────────────────────────────────────────────────────

  it('findAll devuelve todas las empresas paginadas (sin filtro de tenant)', async () => {
    prisma.company.findMany.mockResolvedValue([makeCompany()] as never);
    prisma.company.count.mockResolvedValue(1 as never);

    const result = await service.findAll(pagination);

    expect(result.items).toHaveLength(1);
    expect(prisma.company.findMany).toHaveBeenCalled();
  });

  // ─── create ───────────────────────────────────────────────────────────

  it('create crea empresa y admin inicial dentro de una transacción', async () => {
    prisma.company.create.mockResolvedValue(makeCompany() as never);
    prisma.user.create.mockResolvedValue({
      id: 'admin-1',
      companyId: 'company-1',
      role: 'ADMIN',
    } as never);

    await service.create(
      {
        name: 'Nueva Empresa',
        slug: 'nueva',
        subdomain: 'nueva',
        admin: { username: 'admin', name: 'Administrador' },
      },
      superAdmin,
    );

    expect(prisma.company.create).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN' }),
      }),
    );
  });

  it('create registra audit logs company.created y user.created', async () => {
    prisma.company.create.mockResolvedValue(makeCompany() as never);
    prisma.user.create.mockResolvedValue({ id: 'admin-1', companyId: 'company-1', role: 'ADMIN' } as never);

    await service.create(
      {
        name: 'Nueva Empresa',
        slug: 'nueva',
        subdomain: 'nueva',
        admin: { username: 'admin', name: 'Administrador' },
      },
      superAdmin,
    );

    const actions = (auditMock.record as jest.Mock).mock.calls.map((c) => c[0].action);
    expect(actions).toContain('company.created');
    expect(actions).toContain('user.created');
  });

  // ─── update ───────────────────────────────────────────────────────────

  it('update lanza 404 si la empresa no existe', async () => {
    prisma.company.findUnique.mockResolvedValue(null as never);

    await expect(
      service.update('company-inexistente', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('update persiste los cambios en la empresa existente', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);
    prisma.company.update.mockResolvedValue(makeCompany({ name: 'Nombre Nuevo' }) as never);

    const result = await service.update('company-1', { name: 'Nombre Nuevo' });

    expect(prisma.company.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'company-1' } }),
    );
    expect(result.name).toBe('Nombre Nuevo');
  });

  // ─── updateStatus ─────────────────────────────────────────────────────

  it('updateStatus lanza 404 si la empresa no existe', async () => {
    prisma.company.findUnique.mockResolvedValue(null as never);

    await expect(
      service.updateStatus('company-inexistente', CompanyStatus.SUSPENDED, superAdmin),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateStatus a SUSPENDED registra audit company.suspended', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);
    prisma.company.update.mockResolvedValue(makeCompany({ status: 'SUSPENDED' }) as never);

    await service.updateStatus('company-1', CompanyStatus.SUSPENDED, superAdmin);

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'company.suspended' }),
    );
  });
});
