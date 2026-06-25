import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma, Role } from '@prisma/client';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_STATUSES: LeadStatus[] = [
  LeadStatus.NUEVO,
  LeadStatus.CONTACTADO,
  LeadStatus.EN_SEGUIMIENTO,
  LeadStatus.INTERESADO,
];

function num(value: Prisma.Decimal | number | null | undefined): number {
  return value ? Number(value) : 0;
}

function currentMonthRange(): { gte: Date; lt: Date; year: number; month: number } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
    year,
    month,
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async companyMetrics(user: AuthUser) {
    const companyId = requireCompanyId(user);
    const { gte, lt, year, month } = currentMonthRange();

    const [
      revenueAgg,
      newLeads,
      totalLeads,
      soldLeads,
      statusGroups,
      officeRevenue,
      sellerRevenue,
      productInterest,
      companyGoal,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        _sum: { amount: true },
        where: { companyId, saleDate: { gte, lt } },
      }),
      this.prisma.lead.count({ where: { companyId, createdAt: { gte, lt } } }),
      this.prisma.lead.count({ where: { companyId } }),
      this.prisma.lead.count({ where: { companyId, status: LeadStatus.VENDIDO } }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.sale.groupBy({
        by: ['officeId'],
        where: { companyId, saleDate: { gte, lt } },
        _sum: { amount: true },
      }),
      this.prisma.sale.groupBy({
        by: ['sellerId'],
        where: { companyId, saleDate: { gte, lt } },
        _sum: { amount: true },
      }),
      this.prisma.leadProductInterest.groupBy({
        by: ['productId'],
        where: { companyId },
        _count: { _all: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5,
      }),
      this.prisma.monthlyGoal.findFirst({
        where: { companyId, userId: null, officeId: null, year, month },
      }),
    ]);

    const officeNames = await this.nameMap(
      'office',
      officeRevenue.map((o) => o.officeId).filter((id): id is string => !!id),
    );
    const sellerNames = await this.nameMap(
      'user',
      sellerRevenue.map((s) => s.sellerId),
    );
    const productNames = await this.nameMap(
      'product',
      productInterest.map((p) => p.productId),
    );

    const revenue = num(revenueAgg._sum.amount);
    const goal = num(companyGoal?.targetAmount);

    return {
      period: { year, month },
      revenueThisMonth: revenue,
      goalThisMonth: goal,
      goalProgress: goal > 0 ? Math.round((revenue / goal) * 100) : null,
      newLeadsThisMonth: newLeads,
      totalLeads,
      soldLeads,
      conversionRate:
        totalLeads > 0 ? Math.round((soldLeads / totalLeads) * 100) : 0,
      leadStatusDistribution: statusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      revenueByOffice: officeRevenue
        .map((o) => ({
          officeId: o.officeId,
          officeName: (o.officeId ? officeNames[o.officeId] : undefined) ?? 'Oficina',
          revenue: num(o._sum.amount),
        }))
        .sort((a, b) => b.revenue - a.revenue),
      revenueBySeller: sellerRevenue
        .map((s) => ({
          sellerId: s.sellerId,
          sellerName: sellerNames[s.sellerId] ?? 'Vendedor',
          revenue: num(s._sum.amount),
        }))
        .sort((a, b) => b.revenue - a.revenue),
      topProducts: productInterest.map((p) => ({
        productId: p.productId,
        name: productNames[p.productId] ?? 'Producto',
        requests: p._count._all,
      })),
    };
  }

  async sellerMetrics(user: AuthUser, sellerId: string) {
    const companyId = requireCompanyId(user);

    if (user.role === Role.COORDINADOR) {
      const assigned = await this.prisma.sellerAssignment.findFirst({
        where: { coordinatorId: user.id, sellerId },
      });
      if (!assigned) throw new NotFoundException('Vendedor no encontrado');
    }

    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, companyId },
    });
    if (!seller) throw new NotFoundException('Vendedor no encontrado');

    return this.scopedSellerMetrics(companyId, sellerId);
  }

  async meMetrics(user: AuthUser) {
    if (user.role !== Role.VENDEDOR) {
      throw new BusinessError(422, 'Métricas personales solo para vendedores');
    }
    const companyId = requireCompanyId(user);
    const base = await this.scopedSellerMetrics(companyId, user.id);

    const leadsToContact = await this.prisma.lead.count({
      where: {
        companyId,
        status: { in: ACTIVE_STATUSES },
        OR: [{ sellerId: user.id }, { officeId: user.officeId ?? '__none__' }],
      },
    });

    return { ...base, leadsToContact };
  }

  async coordinatorMetrics(user: AuthUser) {
    const companyId = requireCompanyId(user);
    const sellerIds = await this.getAssignedSellerIds(user.id);
    const ids = sellerIds.length ? sellerIds : ['__no_match__'];
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [sellerUsers, staleLeads, overdueTasks] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      }),
      this.prisma.lead.findMany({
        where: {
          companyId,
          sellerId: { in: ids },
          status: { in: ACTIVE_STATUSES },
          OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: cutoff } }],
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          lastContactedAt: true,
          sellerId: true,
        },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          assignedToId: { in: ids },
          status: { not: 'COMPLETADA' },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const sellers = await Promise.all(
      sellerUsers.map(async (s) => ({
        name: s.name,
        ...(await this.scopedSellerMetrics(companyId, s.id)),
      })),
    );

    return { sellers, staleLeads, overdueTasks };
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }

  private async scopedSellerMetrics(companyId: string, sellerId: string) {
    const { gte, lt, year, month } = currentMonthRange();

    const [revenueAgg, statusGroups, totalLeads, soldLeads, goal] =
      await Promise.all([
        this.prisma.sale.aggregate({
          _sum: { amount: true },
          where: { companyId, sellerId, saleDate: { gte, lt } },
        }),
        this.prisma.lead.groupBy({
          by: ['status'],
          where: { companyId, sellerId },
          _count: { _all: true },
        }),
        this.prisma.lead.count({ where: { companyId, sellerId } }),
        this.prisma.lead.count({
          where: { companyId, sellerId, status: LeadStatus.VENDIDO },
        }),
        this.prisma.monthlyGoal.findFirst({
          where: { companyId, userId: sellerId, year, month },
        }),
      ]);

    const revenue = num(revenueAgg._sum.amount);
    const target = num(goal?.targetAmount);

    return {
      period: { year, month },
      sellerId,
      revenueThisMonth: revenue,
      personalGoal: target,
      goalProgress: target > 0 ? Math.round((revenue / target) * 100) : null,
      totalLeads,
      soldLeads,
      conversionRate:
        totalLeads > 0 ? Math.round((soldLeads / totalLeads) * 100) : 0,
      leadsByStatus: statusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
    };
  }

  private async nameMap(
    entity: 'office' | 'user' | 'product',
    ids: string[],
  ): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const where = { id: { in: ids } };
    const select = { id: true, name: true };
    const rows =
      entity === 'office'
        ? await this.prisma.office.findMany({ where, select })
        : entity === 'user'
          ? await this.prisma.user.findMany({ where, select })
          : await this.prisma.product.findMany({ where, select });
    return Object.fromEntries(rows.map((r) => [r.id, r.name]));
  }
}
