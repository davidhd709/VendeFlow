import { Injectable, NotFoundException } from '@nestjs/common';
import { Company, CompanyStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/types/auth-user';
import { throwOnDuplicate } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Company>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.company.count(),
    ]);
    return paginated(items, total, pagination.page, pagination.limit);
  }

  async create(
    dto: CreateCompanyDto,
    actor: AuthUser,
  ): Promise<{ company: Company; tempPassword: string }> {
    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    try {
      const company = await this.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            subdomain: dto.subdomain,
            status: dto.status ?? CompanyStatus.ACTIVE,
          },
        });
        const admin = await tx.user.create({
          data: {
            username: dto.admin.username,
            passwordHash,
            name: dto.admin.name,
            email: dto.admin.email,
            role: 'ADMIN',
            companyId: company.id,
            mustChangePassword: true,
          },
        });
        await this.audit.record(
          {
            companyId: company.id,
            actorId: actor.id,
            actorRole: actor.role,
            action: 'company.created',
            targetId: company.id,
            targetType: 'Company',
          },
          tx,
        );
        await this.audit.record(
          {
            companyId: company.id,
            actorId: actor.id,
            actorRole: actor.role,
            action: 'user.created',
            targetId: admin.id,
            targetType: 'User',
          },
          tx,
        );
        return company;
      });
      return { company, tempPassword };
    } catch (error) {
      throwOnDuplicate(error, 'El slug o subdominio ya está en uso');
    }
  }

  async resetAdminPassword(
    companyId: string,
    actor: AuthUser,
  ): Promise<{ tempPassword: string }> {
    const admin = await this.prisma.user.findFirst({
      where: { companyId, role: 'ADMIN' },
    });
    if (!admin) throw new NotFoundException('Administrador no encontrado');
    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.audit.record({
      companyId,
      actorId: actor.id,
      actorRole: actor.role,
      action: 'user.password_reset',
      targetId: admin.id,
      targetType: 'User',
    });
    return { tempPassword };
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.ensureExists(id);
    try {
      return await this.prisma.company.update({ where: { id }, data: dto });
    } catch (error) {
      throwOnDuplicate(error, 'El slug o subdominio ya está en uso');
    }
  }

  async updateStatus(
    id: string,
    status: CompanyStatus,
    actor: AuthUser,
  ): Promise<Company> {
    await this.ensureExists(id);
    const updated = await this.prisma.company.update({
      where: { id },
      data: { status },
    });
    await this.audit.record({
      companyId: id,
      actorId: actor.id,
      actorRole: actor.role,
      action:
        status === CompanyStatus.SUSPENDED
          ? 'company.suspended'
          : 'company.status_changed',
      targetId: id,
      targetType: 'Company',
    });
    return updated;
  }

  async getGlobalMetrics(): Promise<{
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    leadsLast30Days: number;
    totalSalesAmount: number;
    topCompanies: { id: string; name: string; subdomain: string; leadsLast30Days: number }[];
    inactiveCompanies: { id: string; name: string; subdomain: string; daysSinceLastActivity: number }[];
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      leadsLast30Days,
      salesAggregate,
      topLeadsByCompany,
      activeCompaniesList,
    ] = await this.prisma.$transaction([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: CompanyStatus.ACTIVE } }),
      this.prisma.company.count({ where: { status: CompanyStatus.SUSPENDED } }),
      this.prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.sale.aggregate({ _sum: { amount: true } }),
      this.prisma.lead.groupBy({
        by: ['companyId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.company.findMany({
        where: { status: CompanyStatus.ACTIVE },
        select: { id: true, name: true, subdomain: true },
      }),
    ]);

    // Resolve top companies details
    const topCompanyIds = topLeadsByCompany.map((g) => g.companyId);
    const topCompanyDetails = await this.prisma.company.findMany({
      where: { id: { in: topCompanyIds } },
      select: { id: true, name: true, subdomain: true },
    });
    const topCompanyMap = new Map(topCompanyDetails.map((c) => [c.id, c]));
    const topCompanies = topLeadsByCompany.map((g) => ({
      id: g.companyId,
      name: topCompanyMap.get(g.companyId)?.name ?? '',
      subdomain: topCompanyMap.get(g.companyId)?.subdomain ?? '',
      leadsLast30Days: typeof g._count === 'object' ? (g._count as Record<string, number>).id ?? 0 : 0,
    }));

    // Inactive companies: ACTIVE companies with no AuditLog in the last 14 days
    const activeIds = activeCompaniesList.map((c) => c.id);
    const recentAuditLogs = await this.prisma.auditLog.findMany({
      where: {
        companyId: { in: activeIds },
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { companyId: true },
      distinct: ['companyId'],
    });
    const recentlyActiveIds = new Set(recentAuditLogs.map((l) => l.companyId));

    const inactiveIds = activeIds.filter((id) => !recentlyActiveIds.has(id));

    // For each inactive company, find the last AuditLog to compute daysSinceLastActivity
    const lastLogs = await this.prisma.auditLog.findMany({
      where: { companyId: { in: inactiveIds } },
      select: { companyId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      distinct: ['companyId'],
    });
    const lastLogMap = new Map(lastLogs.map((l) => [l.companyId, l.createdAt]));
    const now = new Date();

    const inactiveCompanies = activeCompaniesList
      .filter((c) => inactiveIds.includes(c.id))
      .map((c) => {
        const lastLog = lastLogMap.get(c.id);
        const daysSinceLastActivity = lastLog
          ? Math.floor((now.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return { id: c.id, name: c.name, subdomain: c.subdomain, daysSinceLastActivity };
      })
      .sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity)
      .slice(0, 10);

    return {
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      leadsLast30Days,
      totalSalesAmount: Number(salesAggregate._sum.amount ?? 0),
      topCompanies,
      inactiveCompanies,
    };
  }

  async getCompanyUsers(
    companyId: string,
  ): Promise<{ id: string; username: string; name: string; role: string; email: string | null; createdAt: Date }[]> {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSetupStatus(companyId: string): Promise<{
    hasOffice: boolean;
    hasProduct: boolean;
    hasSeller: boolean;
    hasWebsiteConfig: boolean;
  }> {
    const [offices, products, sellers, config] = await this.prisma.$transaction([
      this.prisma.office.count({ where: { companyId, isActive: true } }),
      this.prisma.product.count({ where: { companyId, isActive: true } }),
      this.prisma.user.count({ where: { companyId, role: 'VENDEDOR' } }),
      this.prisma.websiteConfig.count({ where: { companyId } }),
    ]);
    return {
      hasOffice:        offices > 0,
      hasProduct:       products > 0,
      hasSeller:        sellers > 0,
      hasWebsiteConfig: config > 0,
    };
  }

  private async ensureExists(id: string): Promise<void> {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');
  }
}
