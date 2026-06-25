import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const filters = { page: 1, limit: 50, skip: 0, take: 50 } as never;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'u-target',
  companyId: 'company-A',
  username: 'vendedor1',
  passwordHash: 'hash',
  name: 'Vendedor Uno',
  email: null,
  role: Role.VENDEDOR,
  isActive: true,
  officeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UsersService — tenant isolation', () => {
  let service: UsersService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : (arg as () => unknown)(),
    );
    service = new UsersService(prisma as unknown as PrismaService, auditMock);
  });

  // ─── findAll ─────────────────────────────────────────────────────────

  it('findAll filtra siempre por companyId del token', async () => {
    prisma.user.findMany.mockResolvedValue([] as never);
    prisma.user.count.mockResolvedValue(0 as never);

    await service.findAll(makeUser(), filters);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('COORDINADOR solo ve sus vendedores asignados', async () => {
    prisma.sellerAssignment.findMany.mockResolvedValue([
      { sellerId: 'seller-1' }, { sellerId: 'seller-2' },
    ] as never);
    prisma.user.findMany.mockResolvedValue([] as never);
    prisma.user.count.mockResolvedValue(0 as never);

    await service.findAll(makeUser({ role: Role.COORDINADOR, id: 'coord-1' }), filters);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['seller-1', 'seller-2'] },
        }),
      }),
    );
  });

  it('COORDINADOR sin vendedores asignados no obtiene coincidencias', async () => {
    prisma.sellerAssignment.findMany.mockResolvedValue([] as never);
    prisma.user.findMany.mockResolvedValue([] as never);
    prisma.user.count.mockResolvedValue(0 as never);

    await service.findAll(makeUser({ role: Role.COORDINADOR, id: 'coord-1' }), filters);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['__no_match__'] } }),
      }),
    );
  });

  // ─── create ──────────────────────────────────────────────────────────

  it('create rechaza rol ADMIN (no asignable)', async () => {
    await expect(
      service.create(makeUser(), {
        username: 'nuevo',
        name: 'Nuevo',
        role: Role.ADMIN,
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('create rechaza username duplicado dentro de la empresa', async () => {
    prisma.user.findFirst.mockResolvedValue(dbUser() as never);

    await expect(
      service.create(makeUser(), {
        username: 'vendedor1',
        name: 'Otro',
        role: Role.VENDEDOR,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('create inyecta companyId del token (nunca del body)', async () => {
    prisma.user.findFirst.mockResolvedValue(null as never);
    prisma.user.create.mockResolvedValue(dbUser() as never);

    await service.create(makeUser(), {
      username: 'nuevo',
      name: 'Nuevo',
      role: Role.VENDEDOR,
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('create registra audit log user.created', async () => {
    prisma.user.findFirst.mockResolvedValue(null as never);
    prisma.user.create.mockResolvedValue(dbUser() as never);

    await service.create(makeUser(), {
      username: 'nuevo',
      name: 'Nuevo',
      role: Role.VENDEDOR,
    });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.created', targetType: 'User' }),
    );
  });

  // ─── update ──────────────────────────────────────────────────────────

  it('update lanza 404 si el usuario no pertenece a la empresa', async () => {
    prisma.user.findFirst.mockResolvedValue(null as never);

    await expect(
      service.update(makeUser(), 'u-otro-tenant', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── resetPassword ────────────────────────────────────────────────────

  it('resetPassword lanza 404 si el usuario no pertenece a la empresa', async () => {
    prisma.user.findFirst.mockResolvedValue(null as never);

    await expect(
      service.resetPassword(makeUser(), 'u-otro-tenant'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── assignSeller ─────────────────────────────────────────────────────

  it('assignSeller lanza 404 si el coordinador no es de la empresa', async () => {
    prisma.user.findFirst.mockResolvedValue(null as never);

    await expect(
      service.assignSeller(makeUser(), 'coord-otro-tenant', 'seller-1'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── updateStatus ─────────────────────────────────────────────────────

  it('updateStatus lanza 404 si el usuario no es de la empresa', async () => {
    prisma.user.findFirst.mockResolvedValue(null as never);

    await expect(
      service.updateStatus(makeUser(), 'u-otro-tenant', false),
    ).rejects.toThrow(NotFoundException);
  });
});
