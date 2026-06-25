import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditLog, Prisma, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { paginated, PaginatedResponse } from '../common/dto/paginated-response';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { PrismaService } from '../prisma/prisma.service';
import { AuditFiltersDto } from './dto/audit-filters.dto';

type AuditLogWithRelations = AuditLog & {
  actor?: { name: string } | null;
  company?: { name: string } | null;
};

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('global')
  @Roles(Role.SUPERADMIN)
  async findGlobal(
    @Query() filters: AuditFiltersDto,
  ): Promise<PaginatedResponse<AuditLogWithRelations>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.action)     where.action     = { contains: filters.action, mode: 'insensitive' };
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.actorId)    where.actorId    = filters.actorId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59Z`) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
        include: {
          actor: { select: { name: true } },
          company: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginated(items as unknown as AuditLogWithRelations[], total, filters.page, filters.limit);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: AuditFiltersDto,
  ): Promise<PaginatedResponse<AuditLog>> {
    const companyId = requireCompanyId(user);
    const where: Prisma.AuditLogWhereInput = { companyId };

    if (filters.action)     where.action     = { contains: filters.action, mode: 'insensitive' };
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.actorId)    where.actorId    = filters.actorId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59Z`) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
        include: {
          actor: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginated(items as unknown as AuditLog[], total, filters.page, filters.limit);
  }
}
