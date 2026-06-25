import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  companyId?: string | null;
  actorId?: string | null;
  actorRole?: Role | null;
  action: string;
  targetId?: string;
  targetType?: string;
  ip?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría. Acepta un cliente de transacción para
   * escribir dentro de la misma transacción que la operación auditada.
   * Nunca debe tumbar la operación principal.
   */
  async record(
    entry: AuditEntry,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.auditLog.create({
        data: {
          companyId: entry.companyId ?? null,
          actorId: entry.actorId ?? null,
          actorRole: entry.actorRole ?? null,
          action: entry.action,
          targetId: entry.targetId,
          targetType: entry.targetType,
          ip: entry.ip,
          metadata: entry.metadata,
        },
      });
    } catch (error) {
      this.logger.error(
        `No se pudo registrar audit log: ${entry.action}`,
        error as Error,
      );
    }
  }
}
