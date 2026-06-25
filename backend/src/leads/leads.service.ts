import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowUp, InternalComment, Lead, Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { ImportLeadsDto } from './dto/import-leads.dto';
import { LeadFiltersDto } from './dto/lead-filters.dto';

const NO_MATCH = '__no_match__';

/** Normaliza para comparación tolerante a tildes, mayúsculas y espacios. */
function norm(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(new RegExp('[\u0300-\u036f]', 'g'), '');
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(
    user: AuthUser,
    filters: LeadFiltersDto,
  ): Promise<PaginatedResponse<Lead>> {
    const where = await this.scopedWhere(user);
    if (filters.status)   where.status   = filters.status;
    if (filters.officeId) where.officeId = filters.officeId;
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.search) {
      const s = filters.search.trim();
      where.OR = [
        { name:           { contains: s, mode: 'insensitive' } },
        { phone:          { contains: s } },
        { documentNumber: { contains: s } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo   ? { lte: new Date(`${filters.dateTo}T23:59:59Z`) } : {}),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
        include: {
          office: { select: { name: true } },
          seller: { select: { name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return paginated(items as unknown as Lead[], total, filters.page, filters.limit);
  }

  async findOne(user: AuthUser, id: string): Promise<Lead> {
    const where = await this.scopedWhere(user);
    where.id = id;
    const lead = await this.prisma.lead.findFirst({ where });
    // 404 (no 403) cuando el lead es de otro tenant o fuera del alcance del rol.
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  async create(user: AuthUser, dto: CreateLeadDto): Promise<Lead> {
    const companyId = requireCompanyId(user);

    // VENDEDOR: usa su propia oficina si no se envía officeId
    const officeId: string | null =
      user.role === Role.VENDEDOR
        ? dto.officeId ?? user.officeId ?? (() => { throw new BusinessError(422, 'Tu usuario no tiene oficina asignada. Pide a tu admin que te asigne una.', 'BUSINESS_RULE_VIOLATION', 'officeId'); })()
        : (dto.officeId ?? null);

    if (officeId) await this.ensureOffice(companyId, officeId);

    let sellerId = dto.sellerId ?? null;
    if (user.role === Role.VENDEDOR) {
      sellerId = user.id;
    } else if (user.role === Role.COORDINADOR && sellerId) {
      await this.ensureSellerBelongsToCoordinator(user.id, sellerId, companyId);
    }
    if (sellerId) await this.ensureSeller(companyId, sellerId);

    const lead = await this.prisma.lead.create({
      data: {
        companyId,
        officeId: officeId ?? undefined,
        sellerId: sellerId ?? undefined,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
        source: dto.source ?? 'manual',
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        activationDate: dto.activationDate ? new Date(dto.activationDate) : null,
      } as Prisma.LeadUncheckedCreateInput,
    });
    await this.linkProducts(companyId, lead.id, dto.productIds);
    return lead;
  }

  async importLeads(
    user: AuthUser,
    dto: ImportLeadsDto,
  ): Promise<{ created: number; skipped: number; errors: { row: number; reason: string }[] }> {
    const companyId = requireCompanyId(user);

    // Carga oficinas y vendedores de la empresa una sola vez
    const [offices, sellers] = await Promise.all([
      this.prisma.office.findMany({
        where: { companyId },
        select: { id: true, name: true },
      }),
      this.prisma.user.findMany({
        where: { companyId, role: Role.VENDEDOR, isActive: true },
        select: { id: true, name: true },
      }),
    ]);
    const officeByName = new Map(offices.map((o) => [norm(o.name), o.id]));
    const sellerByName = new Map(sellers.map((s) => [norm(s.name), s.id]));
    const defaultOfficeId = user.officeId ?? offices[0]?.id ?? null;

    // Para COORDINADOR: pre-cargar sus sellers asignados para validar
    let allowedSellerIds: Set<string> | null = null;
    if (user.role === Role.COORDINADOR) {
      const ids = await this.getAssignedSellerIds(user.id);
      allowedSellerIds = new Set(ids);
    }

    let created = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      try {
        // Resolver oficina
        let officeId: string | null = null;
        if (row.officeName?.trim()) {
          officeId = officeByName.get(norm(row.officeName)) ?? null;
          if (!officeId) {
            errors.push({ row: i + 1, reason: `Oficina "${row.officeName}" no encontrada` });
            skipped++;
            continue;
          }
        } else {
          officeId = defaultOfficeId;
        }
        if (!officeId) {
          errors.push({ row: i + 1, reason: 'Sin oficina disponible para este registro' });
          skipped++;
          continue;
        }

        // Resolver vendedor por nombre del Excel
        let sellerId: string | null = null;
        if (row.sellerName?.trim()) {
          const resolved = sellerByName.get(norm(row.sellerName)) ?? null;
          if (resolved) {
            // COORDINADOR solo puede asignar sus propios vendedores
            if (!allowedSellerIds || allowedSellerIds.has(resolved)) {
              sellerId = resolved;
            }
          }
        }

        // Fecha de activación
        let activationDate: Date | null = null;
        if (row.activationDate) {
          const d = new Date(row.activationDate);
          if (!isNaN(d.getTime())) activationDate = d;
        }

        await this.prisma.lead.create({
          data: {
            companyId,
            officeId,
            sellerId,
            name: row.name,
            phone: row.phone,
            documentType: row.documentType ?? null,
            documentNumber: row.documentNumber ?? null,
            activationDate,
            source: row.source ?? 'excel',
          },
        });
        created++;
      } catch {
        errors.push({ row: i + 1, reason: 'Error interno al crear el registro' });
        skipped++;
      }
    }

    return { created, skipped, errors };
  }

  /** Creación desde la web pública: companyId/officeId fijados por el servidor. */
  async createFromPublic(dto: CreatePublicLeadDto): Promise<{ id: string }> {
    const company = await this.prisma.company.findUnique({
      where: { subdomain: dto.subdomain },
    });
    if (!company || company.status === 'SUSPENDED') {
      throw new NotFoundException('Empresa no encontrada');
    }
    const office = await this.prisma.office.findFirst({
      where: { id: dto.officeId, companyId: company.id, isActive: true },
    });
    if (!office) {
      throw new BusinessError(
        422,
        'La oficina seleccionada no está disponible',
        'BUSINESS_RULE_VIOLATION',
        'officeId',
      );
    }

    const lead = await this.prisma.lead.create({
      data: {
        companyId: company.id,
        officeId: office.id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
        source: 'web',
      },
    });
    await this.linkProducts(company.id, lead.id, dto.productIds);
    return { id: lead.id };
  }

  async assignSeller(
    user: AuthUser,
    leadId: string,
    sellerId: string | null,
  ): Promise<Lead> {
    const lead = await this.findOne(user, leadId);
    const companyId = lead.companyId;

    if (sellerId) {
      if (user.role === Role.COORDINADOR) {
        await this.ensureSellerBelongsToCoordinator(user.id, sellerId, companyId);
      } else {
        await this.ensureSeller(companyId, sellerId);
      }
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { sellerId },
    });

    // Notificar al vendedor asignado (si no se está autoasignando)
    if (sellerId && sellerId !== user.id) {
      this.notifications.notify([{
        companyId,
        userId: sellerId,
        type: 'LEAD_ASSIGNED',
        title: 'Te asignaron un lead',
        body: `El lead "${lead.name}" fue asignado a ti.`,
        leadId,
      }]).catch(() => {});
    }

    return updated;
  }

  async updateStatus(
    user: AuthUser,
    id: string,
    status: Lead['status'],
  ): Promise<Lead> {
    const existing = await this.findOne(user, id); // aplica scope + 404
    if (existing.status === status) return existing;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: { status },
      });
      await tx.leadStatusHistory.create({
        data: {
          companyId: existing.companyId,
          leadId: id,
          fromState: existing.status,
          toState: status,
          changedBy: user.id,
        },
      });
      await this.audit.record(
        {
          companyId: existing.companyId,
          actorId: user.id,
          actorRole: user.role,
          action: 'lead.status_changed',
          targetId: id,
          targetType: 'Lead',
          metadata: { from: existing.status, to: status },
        },
        tx,
      );
      return updated;
    });
  }

  // ─── Seguimientos (Fase 2) ───────────────────────────────────────────

  async addFollowUp(
    user: AuthUser,
    leadId: string,
    dto: CreateFollowUpDto,
  ): Promise<FollowUp> {
    const lead = await this.findOne(user, leadId); // aplica scope + 404
    const [followUp] = await this.prisma.$transaction([
      this.prisma.followUp.create({
        data: {
          companyId: lead.companyId,
          leadId,
          sellerId: user.id,
          channel: dto.channel ?? 'WHATSAPP',
          notes: dto.notes,
          nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : null,
        },
      }),
      this.prisma.lead.update({
        where: { id: leadId },
        data: { lastContactedAt: new Date() },
      }),
    ]);

    // Notificar al coordinador del vendedor (si tiene uno)
    if (user.role === Role.VENDEDOR) {
      const coordinator = await this.notifications.getCoordinatorOf(user.id);
      if (coordinator) {
        this.notifications.notify([{
          companyId: lead.companyId,
          userId: coordinator.id,
          type: 'FOLLOWUP_ADDED',
          title: 'Nuevo seguimiento',
          body: `${user.username} registró un seguimiento en el lead "${lead.name}".`,
          leadId,
        }]).catch(() => {});
      }
    }

    return followUp;
  }

  async getFollowUps(user: AuthUser, leadId: string): Promise<FollowUp[]> {
    await this.findOne(user, leadId); // aplica scope + 404
    return this.prisma.followUp.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Comentarios internos (Fase 3) — invisibles al cliente ───────────

  async addComment(
    user: AuthUser,
    leadId: string,
    body: string,
  ): Promise<InternalComment> {
    const lead = await this.findOne(user, leadId); // aplica scope + 404
    const comment = await this.prisma.internalComment.create({
      data: { companyId: lead.companyId, leadId, authorId: user.id, body },
    });

    // Notificar: VENDEDOR → coordinador + admin; COORDINADOR → admin
    const recipients: string[] = [];
    if (user.role === Role.VENDEDOR) {
      const coordinator = await this.notifications.getCoordinatorOf(user.id);
      if (coordinator) recipients.push(coordinator.id);
    }
    if (user.role === Role.VENDEDOR || user.role === Role.COORDINADOR) {
      const admin = await this.notifications.getAdminOf(lead.companyId);
      if (admin && admin.id !== user.id) recipients.push(admin.id);
    }

    if (recipients.length) {
      const preview = body.length > 60 ? body.slice(0, 60) + '…' : body;
      this.notifications.notify(
        recipients.map((userId) => ({
          companyId: lead.companyId,
          userId,
          type: 'COMMENT_ADDED' as const,
          title: `Comentario en "${lead.name}"`,
          body: `${user.username}: "${preview}"`,
          leadId,
        })),
      ).catch(() => {});
    }

    return comment;
  }

  async getComments(user: AuthUser, leadId: string) {
    await this.findOne(user, leadId); // aplica scope + 404
    return this.prisma.internalComment.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async getStatusHistory(user: AuthUser, leadId: string) {
    const lead = await this.findOne(user, leadId); // aplica scope + 404
    const entries = await this.prisma.leadStatusHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: 'asc' },
    });
    if (!entries.length) return [];

    const actorIds = [...new Set(entries.map((e) => e.changedBy))];
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds }, companyId: lead.companyId },
      select: { id: true, name: true },
    });
    const actorMap = Object.fromEntries(actors.map((a) => [a.id, a.name]));

    return entries.map((e) => ({
      id: e.id,
      fromState: e.fromState,
      toState: e.toState,
      changedBy: e.changedBy,
      changedByName: actorMap[e.changedBy] ?? null,
      createdAt: e.createdAt,
    }));
  }

  async getTasksForLead(user: AuthUser, leadId: string) {
    await this.findOne(user, leadId); // scope + 404
    return this.prisma.task.findMany({
      where: { leadId, companyId: requireCompanyId(user) },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** where con aislamiento de tenant + alcance por rol. */
  private async scopedWhere(user: AuthUser): Promise<Prisma.LeadWhereInput> {
    const companyId = requireCompanyId(user);
    const where: Prisma.LeadWhereInput = { companyId };

    if (user.role === Role.VENDEDOR) {
      where.OR = [
        { sellerId: user.id },
        { officeId: user.officeId ?? NO_MATCH },
      ];
    } else if (user.role === Role.COORDINADOR) {
      const sellerIds = await this.getAssignedSellerIds(user.id);
      where.sellerId = { in: sellerIds.length ? sellerIds : [NO_MATCH] };
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

  private async ensureSellerBelongsToCoordinator(
    coordinatorId: string,
    sellerId: string,
    companyId: string,
  ): Promise<void> {
    const link = await this.prisma.sellerAssignment.findFirst({
      where: { coordinatorId, sellerId },
    });
    if (!link) {
      throw new BusinessError(
        422,
        'El vendedor no está asignado a tu coordinación',
        'BUSINESS_RULE_VIOLATION',
        'sellerId',
      );
    }
    // También verificar que el vendedor pertenece a la empresa
    await this.ensureSeller(companyId, sellerId);
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

  private async ensureSeller(companyId: string, sellerId: string): Promise<void> {
    const seller = await this.prisma.user.findFirst({
      where: { id: sellerId, companyId, role: Role.VENDEDOR },
    });
    if (!seller) {
      throw new BusinessError(
        422,
        'El vendedor no pertenece a tu empresa',
        'BUSINESS_RULE_VIOLATION',
        'sellerId',
      );
    }
  }

  private async linkProducts(
    companyId: string,
    leadId: string,
    productIds?: string[],
  ): Promise<void> {
    if (!productIds?.length) return;
    // Solo productos que existen en esta empresa (evita FK inválida / fuga cruzada).
    const valid = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId },
      select: { id: true },
    });
    if (!valid.length) return;
    await this.prisma.leadProductInterest.createMany({
      data: valid.map((p) => ({ companyId, leadId, productId: p.id })),
      skipDuplicates: true,
    });
  }
}
