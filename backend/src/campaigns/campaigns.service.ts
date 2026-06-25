import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { paginated } from '../common/dto/paginated-response';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { buildWaLink, personalizeMessage } from '../common/utils/wa-link';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

const NO_MATCH = '__no_match__';
const MAX_RECIPIENTS = 10;

export type ReactivationType =
  | 'PLAN_RENEWAL'
  | 'EQUIPMENT_UPGRADE'
  | 'ANNIVERSARY'
  | 'DORMANT_BUYER';

export interface ReactivationSuggestion {
  leadId: string;
  name: string;
  phone: string;
  context: string; // texto explicativo personalizado por tipo
}

const SUGGESTED_MESSAGES: Record<ReactivationType, string> = {
  PLAN_RENEWAL:
    '¡Hola {nombre}! Tu plan está a punto de cumplir un año. Tenemos opciones con más datos al mismo precio de antes. ¿Te cuento cuál te conviene más?',
  EQUIPMENT_UPGRADE:
    '¡Hola {nombre}! Tu equipo ya lleva un buen tiempo contigo. Los modelos nuevos tienen el doble de procesador y la batería dura todo el día. ¿Pasas esta semana y lo vemos?',
  ANNIVERSARY:
    '¡Hola {nombre}! Hoy hace exactamente un año que entraste a nuestra familia. Gracias por confiar en nosotros — tenemos algo especial esperándote. ¿Cuándo puedes pasar?',
  DORMANT_BUYER:
    '¡Hola {nombre}! Tiempo sin hablarnos. Han llegado muchas novedades desde tu última visita. ¿Qué tal si te cuento las opciones nuevas sin compromiso?',
};

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthUser, pagination: PaginationDto) {
    const where = await this.scopedWhere(user);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
        include: { _count: { select: { recipients: true } } },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    const mapped = items.map((c) => ({
      ...c,
      recipientCount: c._count.recipients,
    }));
    return paginated(mapped, total, pagination.page, pagination.limit);
  }

  async findOne(user: AuthUser, id: string) {
    const where = await this.scopedWhere(user);
    where.id = id;
    const campaign = await this.prisma.campaign.findFirst({
      where,
      include: { recipients: true },
    });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }

  async create(user: AuthUser, dto: CreateCampaignDto) {
    const companyId = requireCompanyId(user);

    if (dto.recipientLeadIds.length > MAX_RECIPIENTS) {
      throw new BusinessError(
        422,
        `El máximo de destinatarios por campaña es ${MAX_RECIPIENTS}`,
        'BUSINESS_RULE_VIOLATION',
        'recipientLeadIds',
      );
    }

    let message = dto.message;
    if (dto.templateId) {
      const template = await this.prisma.messageTemplate.findFirst({
        where: { id: dto.templateId, companyId, isActive: true },
      });
      if (!template) {
        throw new BusinessError(422, 'La plantilla no está disponible', 'BUSINESS_RULE_VIOLATION', 'templateId');
      }
      message = message ?? template.body;
    }
    if (!message) {
      throw new BusinessError(422, 'Debes indicar un mensaje o una plantilla', 'BUSINESS_RULE_VIOLATION', 'message');
    }

    // Scope de leads según rol: ADMIN ve toda la empresa, VENDEDOR solo los suyos.
    const leadScope = this.buildLeadScope(user, companyId);
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: dto.recipientLeadIds }, ...leadScope },
    });
    if (leads.length !== dto.recipientLeadIds.length) {
      throw new BusinessError(
        422,
        'Algunos clientes no están disponibles para ti',
        'BUSINESS_RULE_VIOLATION',
        'recipientLeadIds',
      );
    }

    const finalMessage = message;
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          companyId,
          createdById: user.id,
          templateId: dto.templateId,
          name: dto.name,
          message: finalMessage,
          status: 'ENVIADA',
          sentAt: new Date(),
        },
      });

      await tx.campaignRecipient.createMany({
        data: leads.map((lead) => {
          const text = personalizeMessage(finalMessage, lead.name);
          return {
            campaignId: campaign.id,
            leadId: lead.id,
            name: lead.name,
            phone: lead.phone,
            waLink: buildWaLink(lead.phone, text),
          };
        }),
      });

      await this.audit.record(
        {
          companyId,
          actorId: user.id,
          actorRole: user.role,
          action: 'campaign.sent',
          targetId: campaign.id,
          targetType: 'Campaign',
          metadata: { recipients: leads.length },
        },
        tx,
      );

      return tx.campaign.findUnique({
        where: { id: campaign.id },
        include: { recipients: true },
      });
    });
  }

  async getReactivationSuggestions(
    user: AuthUser,
    type: ReactivationType,
  ): Promise<{ type: ReactivationType; suggestedMessage: string; leads: ReactivationSuggestion[] }> {
    const companyId = requireCompanyId(user);
    const now = new Date();
    const days = (n: number) => n * 24 * 60 * 60 * 1000;

    let leads: ReactivationSuggestion[] = [];

    if (type === 'PLAN_RENEWAL') {
      // Clientes con plan activo cuya activationDate tiene entre 10 y 14 meses.
      const from = new Date(now.getTime() - days(14 * 30));
      const to   = new Date(now.getTime() - days(10 * 30));
      const rows = await this.prisma.lead.findMany({
        where: { companyId, activationDate: { gte: from, lte: to } },
        select: { id: true, name: true, phone: true, activationDate: true },
        orderBy: { activationDate: 'asc' },
        take: 50,
      });
      leads = rows.map((r) => {
        const monthsAgo = Math.round(
          (now.getTime() - r.activationDate!.getTime()) / days(30),
        );
        return {
          leadId: r.id,
          name: r.name,
          phone: r.phone,
          context: `Plan activado hace ${monthsAgo} meses`,
        };
      });
    }

    if (type === 'EQUIPMENT_UPGRADE') {
      // Ventas realizadas hace entre 15 y 24 meses.
      const from = new Date(now.getTime() - days(24 * 30));
      const to   = new Date(now.getTime() - days(15 * 30));
      const sales = await this.prisma.sale.findMany({
        where: { companyId, saleDate: { gte: from, lte: to } },
        include: {
          lead: { select: { id: true, name: true, phone: true } },
          product: { select: { name: true } },
        },
        orderBy: { saleDate: 'asc' },
        take: 50,
      });
      leads = sales.map((s) => {
        const monthsAgo = Math.round(
          (now.getTime() - s.saleDate.getTime()) / days(30),
        );
        return {
          leadId: s.lead.id,
          name: s.lead.name,
          phone: s.lead.phone,
          context: s.product
            ? `Compró ${s.product.name} hace ${monthsAgo} meses`
            : `Última compra hace ${monthsAgo} meses`,
        };
      });
    }

    if (type === 'ANNIVERSARY') {
      // Ventas cuyo aniversario (1 año) cae en los próximos/pasados 15 días.
      const from = new Date(now.getTime() - days(370));
      const to   = new Date(now.getTime() - days(355));
      const sales = await this.prisma.sale.findMany({
        where: { companyId, saleDate: { gte: from, lte: to } },
        include: { lead: { select: { id: true, name: true, phone: true } } },
        orderBy: { saleDate: 'asc' },
        take: 50,
      });
      leads = sales.map((s) => ({
        leadId: s.lead.id,
        name: s.lead.name,
        phone: s.lead.phone,
        context: `Cliente desde ${s.saleDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
      }));
    }

    if (type === 'DORMANT_BUYER') {
      // Clientes con estado VENDIDO sin contacto en 60+ días.
      const cutoff = new Date(now.getTime() - days(60));
      const rows = await this.prisma.lead.findMany({
        where: {
          companyId,
          status: LeadStatus.VENDIDO,
          OR: [
            { lastContactedAt: null },
            { lastContactedAt: { lt: cutoff } },
          ],
        },
        select: { id: true, name: true, phone: true, lastContactedAt: true },
        orderBy: { lastContactedAt: 'asc' },
        take: 50,
      });
      leads = rows.map((r) => {
        const label = r.lastContactedAt
          ? `Sin contacto desde hace ${Math.round((now.getTime() - r.lastContactedAt.getTime()) / days(1))} días`
          : 'Nunca contactado post-venta';
        return { leadId: r.id, name: r.name, phone: r.phone, context: label };
      });
    }

    return { type, suggestedMessage: SUGGESTED_MESSAGES[type], leads };
  }

  private buildLeadScope(
    user: AuthUser,
    companyId: string,
  ): Prisma.LeadWhereInput {
    if (user.role === Role.ADMIN) return { companyId };
    // VENDEDOR y COORDINADOR: solo sus leads
    return {
      companyId,
      OR: [
        { sellerId: user.id },
        { officeId: user.officeId ?? NO_MATCH },
      ],
    };
  }

  private async scopedWhere(
    user: AuthUser,
  ): Promise<Prisma.CampaignWhereInput> {
    const companyId = requireCompanyId(user);
    const where: Prisma.CampaignWhereInput = { companyId };

    if (user.role === Role.VENDEDOR) {
      where.createdById = user.id;
    } else if (user.role === Role.COORDINADOR) {
      const sellerIds = await this.getAssignedSellerIds(user.id);
      where.createdById = { in: sellerIds.length ? sellerIds : [NO_MATCH] };
    }
    return where;
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }
}
