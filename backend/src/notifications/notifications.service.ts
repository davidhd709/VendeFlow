import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { PrismaService } from '../prisma/prisma.service';

export type NotifType = 'COMMENT_ADDED' | 'FOLLOWUP_ADDED' | 'LEAD_ASSIGNED' | 'TASK_ASSIGNED';

export interface CreateNotifDto {
  companyId: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  leadId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecent(user: AuthUser) {
    const companyId = requireCompanyId(user);
    return this.prisma.notification.findMany({
      where: { companyId, userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAllRead(user: AuthUser) {
    const companyId = requireCompanyId(user);
    await this.prisma.notification.updateMany({
      where: { companyId, userId: user.id, isRead: false },
      data: { isRead: true },
    });
  }

  async markOneRead(user: AuthUser, id: string) {
    const companyId = requireCompanyId(user);
    await this.prisma.notification.updateMany({
      where: { id, companyId, userId: user.id },
      data: { isRead: true },
    });
  }

  /** Crea notificaciones para un conjunto de receptores. Falla silenciosamente. */
  async notify(items: CreateNotifDto[]) {
    if (!items.length) return;
    await this.prisma.notification.createMany({ data: items, skipDuplicates: true });
  }

  /** Devuelve el coordinador asignado a un vendedor (si existe). */
  async getCoordinatorOf(sellerId: string): Promise<{ id: string } | null> {
    const link = await this.prisma.sellerAssignment.findFirst({
      where: { sellerId },
      include: { coordinator: { select: { id: true } } },
    });
    return link?.coordinator ?? null;
  }

  /** Devuelve el ADMIN activo de la empresa. */
  async getAdminOf(companyId: string): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: { companyId, role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
  }
}
