import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

const admin: AuthUser = {
  id: 'admin-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  it('todas las consultas de métricas de empresa van filtradas por companyId', async () => {
    prisma.sale.aggregate.mockResolvedValue({ _sum: { amount: null } } as never);
    prisma.lead.count.mockResolvedValue(0 as never);
    prisma.lead.groupBy.mockResolvedValue([] as never);
    prisma.sale.groupBy.mockResolvedValue([] as never);
    prisma.leadProductInterest.groupBy.mockResolvedValue([] as never);
    prisma.monthlyGoal.findFirst.mockResolvedValue(null as never);

    await service.companyMetrics(admin);

    expect(prisma.sale.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
    expect(prisma.lead.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('un COORDINADOR no puede ver métricas de un vendedor no asignado (404)', async () => {
    const coordinator: AuthUser = {
      id: 'coord-1',
      username: 'coord',
      role: Role.COORDINADOR,
      companyId: 'company-A',
      officeId: null,
    };
    prisma.sellerAssignment.findFirst.mockResolvedValue(null as never);

    await expect(
      service.sellerMetrics(coordinator, 'seller-x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
