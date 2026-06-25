import { Injectable } from '@nestjs/common';
import { LeadStatus, Role } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { PrismaService } from '../prisma/prisma.service';

export interface AlertItem {
  type: 'STALE_LEAD' | 'OVERDUE_TASK';
  title: string;
  description: string;
  leadId?: string;
  taskId?: string;
  leadName?: string;
  daysStale?: number;
}

const ACTIVE_STATUSES: LeadStatus[] = [
  LeadStatus.NUEVO,
  LeadStatus.CONTACTADO,
  LeadStatus.EN_SEGUIMIENTO,
  LeadStatus.INTERESADO,
];

const STALE_HOURS = 48;

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlerts(user: AuthUser): Promise<AlertItem[]> {
    const companyId = requireCompanyId(user);
    const alerts: AlertItem[] = [];
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
    const now = new Date();

    // ── Leads sin seguimiento ────────────────────────────
    const leadWhere = await this.buildLeadScope(user, companyId, cutoff);
    if (leadWhere) {
      const stale = await this.prisma.lead.findMany({
        where: leadWhere,
        orderBy: { lastContactedAt: 'asc' },
        take: 15,
        select: {
          id: true,
          name: true,
          lastContactedAt: true,
          seller: { select: { name: true } },
        },
      });
      for (const lead of stale) {
        const sinceMs = now.getTime() - (lead.lastContactedAt?.getTime() ?? 0);
        const daysStale = lead.lastContactedAt
          ? Math.floor(sinceMs / (1000 * 60 * 60 * 24))
          : null;
        const sellerNote =
          user.role !== Role.VENDEDOR && lead.seller?.name
            ? ` — vendedor: ${lead.seller.name}`
            : '';
        alerts.push({
          type: 'STALE_LEAD',
          title: 'Lead sin seguimiento',
          description: daysStale !== null
            ? `${lead.name} lleva ${daysStale} día${daysStale !== 1 ? 's' : ''} sin contacto${sellerNote}.`
            : `${lead.name} nunca ha sido contactado${sellerNote}.`,
          leadId: lead.id,
          leadName: lead.name,
          daysStale: daysStale ?? 999,
        });
      }
    }

    // ── Tareas vencidas ──────────────────────────────────
    const taskScope = this.buildTaskScope(user, companyId);
    const overdue = await this.prisma.task.findMany({
      where: {
        ...taskScope,
        status: { not: 'COMPLETADA' },
        dueDate: { lt: now, not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      select: { id: true, title: true, dueDate: true },
    });
    for (const task of overdue) {
      const days = Math.floor((now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'OVERDUE_TASK',
        title: 'Tarea vencida',
        description: `"${task.title}" venció hace ${days} día${days !== 1 ? 's' : ''}.`,
        taskId: task.id,
      });
    }

    return alerts;
  }

  private async buildLeadScope(user: AuthUser, companyId: string, cutoff: Date) {
    const base = {
      companyId,
      status: { in: ACTIVE_STATUSES },
      OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: cutoff } }],
    };
    if (user.role === Role.VENDEDOR) {
      return { ...base, sellerId: user.id };
    }
    if (user.role === Role.COORDINADOR) {
      // Mismo scope que scopedWhere: solo leads de sellers asignados al coordinador.
      const sellerIds = await this.getAssignedSellerIds(user.id);
      return { ...base, sellerId: { in: sellerIds.length ? sellerIds : ['__no_match__'] } };
    }
    if (user.role === Role.ADMIN) {
      return base;
    }
    return null;
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }

  private buildTaskScope(user: AuthUser, companyId: string) {
    if (user.role === Role.VENDEDOR) {
      return { companyId, assignedToId: user.id };
    }
    return { companyId };
  }
}
