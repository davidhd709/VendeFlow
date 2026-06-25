import { Injectable, NotFoundException } from '@nestjs/common';
import { MonthlyGoal, Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalFiltersDto } from './dto/goal-filters.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

export interface GoalWithProgress extends MonthlyGoal {
  actualAmount: number;
  actualSales: number;
  progress: number | null;
  userName: string | null;
  officeName: string | null;
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    user: AuthUser,
    filters: GoalFiltersDto,
  ): Promise<GoalWithProgress[]> {
    const companyId = requireCompanyId(user);
    const where: Prisma.MonthlyGoalWhereInput = { companyId };
    if (filters.year) where.year = filters.year;
    if (filters.month) where.month = filters.month;

    // Las metas las fija el ADMIN; el resto solo ve las suyas + la meta de empresa.
    if (user.role === Role.VENDEDOR) {
      where.OR = [{ userId: user.id }, { userId: null, officeId: null }];
    } else if (user.role === Role.COORDINADOR) {
      const sellerIds = await this.getAssignedSellerIds(user.id);
      where.OR = [
        { userId: { in: sellerIds } },
        { userId: null, officeId: null },
      ];
    }

    const goals = await this.prisma.monthlyGoal.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        user:   { select: { name: true } },
        office: { select: { name: true } },
      },
    });

    const enriched = await Promise.all(
      goals.map(async (goal) => {
        const periodStart = new Date(goal.year, goal.month - 1, 1);
        const periodEnd   = new Date(goal.year, goal.month, 1);
        const saleWhere: Prisma.SaleWhereInput = {
          companyId,
          saleDate: { gte: periodStart, lt: periodEnd },
        };
        if (goal.userId)   saleWhere.sellerId  = goal.userId;
        if (goal.officeId) saleWhere.officeId  = goal.officeId;
        // Si ni userId ni officeId → meta de empresa, sin filtro adicional

        const agg = await this.prisma.sale.aggregate({
          where: saleWhere,
          _sum: { amount: true },
          _count: { id: true },
        });
        const actualAmount = Number(agg._sum.amount ?? 0);
        const target = Number(goal.targetAmount);
        const progress = target > 0 ? Math.round((actualAmount / target) * 100) : null;
        const { user: u, office: o, ...rest } = goal as typeof goal & { user: { name: string } | null; office: { name: string } | null };
        return {
          ...rest,
          actualAmount,
          actualSales: agg._count.id,
          progress,
          userName:   u?.name   ?? null,
          officeName: o?.name   ?? null,
        };
      }),
    );
    return enriched;
  }

  async create(user: AuthUser, dto: CreateGoalDto): Promise<MonthlyGoal> {
    const companyId = requireCompanyId(user);
    if (dto.officeId) await this.ensureOffice(companyId, dto.officeId);
    if (dto.userId) await this.ensureUser(companyId, dto.userId);

    const duplicate = await this.prisma.monthlyGoal.findFirst({
      where: {
        companyId,
        userId: dto.userId ?? null,
        officeId: dto.officeId ?? null,
        year: dto.year,
        month: dto.month,
      },
    });
    if (duplicate) {
      throw new BusinessError(
        409,
        'Ya existe una meta para ese alcance y periodo',
        'CONFLICT',
      );
    }

    const goal = await this.prisma.monthlyGoal.create({
      data: {
        companyId,
        officeId: dto.officeId,
        userId: dto.userId,
        year: dto.year,
        month: dto.month,
        targetAmount: dto.targetAmount,
        targetSales: dto.targetSales,
      },
    });
    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'goal.set',
      targetId: goal.id,
      targetType: 'MonthlyGoal',
    });
    return goal;
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateGoalDto,
  ): Promise<MonthlyGoal> {
    const companyId = requireCompanyId(user);
    const goal = await this.prisma.monthlyGoal.findFirst({
      where: { id, companyId },
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    return this.prisma.monthlyGoal.update({ where: { id }, data: dto });
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }

  private async ensureOffice(companyId: string, officeId: string): Promise<void> {
    const office = await this.prisma.office.findFirst({
      where: { id: officeId, companyId },
    });
    if (!office) {
      throw new BusinessError(
        422,
        'La oficina no pertenece a tu empresa',
        'BUSINESS_RULE_VIOLATION',
        'officeId',
      );
    }
  }

  private async ensureUser(companyId: string, userId: string): Promise<void> {
    const target = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
    });
    if (!target) {
      throw new BusinessError(
        422,
        'El usuario no pertenece a tu empresa',
        'BUSINESS_RULE_VIOLATION',
        'userId',
      );
    }
  }
}
