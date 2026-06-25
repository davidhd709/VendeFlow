import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma, Role, Sale } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleFiltersDto } from './dto/sale-filters.dto';

const NO_MATCH = '__no_match__';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async registerSale(user: AuthUser, dto: CreateSaleDto): Promise<Sale> {
    const companyId = requireCompanyId(user);

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (!lead) throw new NotFoundException('Lead no encontrado');

      // El VENDEDOR solo registra ventas de leads de su oficina o asignados a él.
      if (user.role === Role.VENDEDOR) {
        const inScope =
          lead.sellerId === user.id || lead.officeId === user.officeId;
        if (!inScope) throw new NotFoundException('Lead no encontrado');
      }

      if (lead.status === LeadStatus.VENDIDO) {
        throw new BusinessError(
          422,
          'Este lead ya tiene una venta registrada',
        );
      }

      if (dto.productId) {
        const product = await tx.product.findFirst({
          where: { id: dto.productId, companyId },
        });
        if (!product) {
          throw new BusinessError(
            422,
            'El producto no pertenece a tu empresa',
            'BUSINESS_RULE_VIOLATION',
            'productId',
          );
        }
      }

      const sale = await tx.sale.create({
        data: {
          companyId,
          officeId: lead.officeId,
          leadId: lead.id,
          sellerId: user.id,
          productId: dto.productId,
          amount: dto.amount,
          notes: dto.notes,
          saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        // El vendedor que cierra reclama el lead si no tenía dueño (atribución de métricas).
        data: { status: LeadStatus.VENDIDO, sellerId: lead.sellerId ?? user.id },
      });
      await tx.leadStatusHistory.create({
        data: {
          companyId,
          leadId: lead.id,
          fromState: lead.status,
          toState: LeadStatus.VENDIDO,
          changedBy: user.id,
        },
      });
      await this.audit.record(
        {
          companyId,
          actorId: user.id,
          actorRole: user.role,
          action: 'sale.registered',
          targetId: sale.id,
          targetType: 'Sale',
        },
        tx,
      );

      return sale;
    });
  }

  async findAll(
    user: AuthUser,
    filters: SaleFiltersDto,
  ): Promise<PaginatedResponse<Sale>> {
    const companyId = requireCompanyId(user);
    const where: Prisma.SaleWhereInput = { companyId };

    if (user.role === Role.VENDEDOR) {
      where.sellerId = user.id;
    } else if (user.role === Role.COORDINADOR) {
      const ids = await this.getAssignedSellerIds(user.id);
      where.sellerId = { in: ids.length ? ids : [NO_MATCH] };
    }

    // Filtros opcionales (solo ADMIN/COORDINADOR pueden filtrar por otro vendedor)
    if (filters.sellerId && user.role !== Role.VENDEDOR) {
      where.sellerId = filters.sellerId;
    }
    if (filters.officeId) {
      where.officeId = filters.officeId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.saleDate = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59Z`) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        orderBy: { saleDate: 'desc' },
        skip: filters.skip,
        take: filters.take,
        include: {
          lead:   { select: { name: true, phone: true } },
          seller: { select: { name: true } },
          office: { select: { name: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return paginated(items, total, filters.page, filters.limit);
  }

  async exportCsv(user: AuthUser, filters: SaleFiltersDto): Promise<string> {
    const companyId = requireCompanyId(user);
    const where: Prisma.SaleWhereInput = { companyId };

    if (user.role === Role.VENDEDOR) {
      where.sellerId = user.id;
    } else if (user.role === Role.COORDINADOR) {
      const ids = await this.getAssignedSellerIds(user.id);
      where.sellerId = { in: ids.length ? ids : [NO_MATCH] };
    }
    if (filters.sellerId && user.role !== Role.VENDEDOR) where.sellerId = filters.sellerId;
    if (filters.officeId) where.officeId = filters.officeId;
    if (filters.dateFrom || filters.dateTo) {
      where.saleDate = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59Z`) } : {}),
      };
    }

    const rows = await this.prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      include: {
        lead:   { select: { name: true, phone: true } },
        seller: { select: { name: true } },
        office: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v).replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = 'Fecha,Cliente,Teléfono,Vendedor,Oficina,Producto,Monto,Notas';
    const lines = rows.map((r) =>
      [
        escape(r.saleDate.toISOString().slice(0, 10)),
        escape(r.lead?.name),
        escape(r.lead?.phone),
        escape(r.seller?.name),
        escape(r.office?.name),
        escape(r.product?.name),
        escape(Number(r.amount).toFixed(2)),
        escape(r.notes),
      ].join(','),
    );

    return [header, ...lines].join('\r\n');
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }
}
