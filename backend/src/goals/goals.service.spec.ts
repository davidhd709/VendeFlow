import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { GoalsService } from './goals.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

const makeGoalRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'goal-1',
  companyId: 'company-A',
  userId: null,
  officeId: null,
  year: 2026,
  month: 6,
  targetAmount: '5000000',
  targetSales: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
  office: null,
  ...overrides,
});

describe('GoalsService — tenant isolation & negocio', () => {
  let service: GoalsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new GoalsService(prisma as unknown as PrismaService, auditMock);
  });

  // ─── findAll ─────────────────────────────────────────────────────────

  it('findAll incluye siempre companyId del token en el where', async () => {
    prisma.monthlyGoal.findMany.mockResolvedValue([] as never);

    await service.findAll(makeUser(), { year: 2026, month: 6 });

    expect(prisma.monthlyGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('VENDEDOR solo ve metas propias o de empresa en findAll', async () => {
    prisma.monthlyGoal.findMany.mockResolvedValue([] as never);

    await service.findAll(
      makeUser({ role: Role.VENDEDOR, id: 'seller-1' }),
      { year: 2026, month: 6 },
    );

    expect(prisma.monthlyGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ userId: 'seller-1' }, { userId: null, officeId: null }],
        }),
      }),
    );
  });

  it('COORDINADOR ve metas de sus vendedores + empresa en findAll', async () => {
    prisma.sellerAssignment.findMany.mockResolvedValue([
      { sellerId: 's-1' }, { sellerId: 's-2' },
    ] as never);
    prisma.monthlyGoal.findMany.mockResolvedValue([] as never);

    await service.findAll(
      makeUser({ role: Role.COORDINADOR, id: 'coord-1' }),
      { year: 2026, month: 6 },
    );

    expect(prisma.monthlyGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { userId: { in: ['s-1', 's-2'] } },
            { userId: null, officeId: null },
          ],
        }),
      }),
    );
  });

  // ─── create ──────────────────────────────────────────────────────────

  it('create inyecta companyId del token', async () => {
    prisma.monthlyGoal.findFirst.mockResolvedValue(null as never);
    prisma.monthlyGoal.create.mockResolvedValue(makeGoalRow() as never);

    await service.create(makeUser(), {
      year: 2026,
      month: 6,
      targetAmount: 5_000_000,
    });

    expect(prisma.monthlyGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('create lanza 409 si ya existe meta para el mismo alcance y periodo', async () => {
    prisma.monthlyGoal.findFirst.mockResolvedValue(makeGoalRow() as never);

    await expect(
      service.create(makeUser(), { year: 2026, month: 6, targetAmount: 1_000_000 }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('create registra audit log goal.set', async () => {
    prisma.monthlyGoal.findFirst.mockResolvedValue(null as never);
    prisma.monthlyGoal.create.mockResolvedValue(makeGoalRow() as never);

    await service.create(makeUser(), {
      year: 2026,
      month: 6,
      targetAmount: 5_000_000,
    });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'goal.set', targetType: 'MonthlyGoal' }),
    );
  });

  it('create valida que la oficina sea de la empresa (si se indica)', async () => {
    prisma.office.findFirst.mockResolvedValue(null as never);

    await expect(
      service.create(makeUser(), {
        year: 2026,
        month: 6,
        targetAmount: 1_000_000,
        officeId: 'office-otro-tenant',
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  // ─── update ──────────────────────────────────────────────────────────

  it('update lanza 404 si la meta no pertenece a la empresa', async () => {
    prisma.monthlyGoal.findFirst.mockResolvedValue(null as never);

    await expect(
      service.update(makeUser(), 'goal-otro-tenant', { targetAmount: 99 }),
    ).rejects.toThrow(NotFoundException);
  });
});
