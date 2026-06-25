import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, Task, TaskStatus } from '@prisma/client';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFiltersDto } from './dto/task-filters.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const NO_MATCH = '__no_match__';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifs: NotificationsService,
  ) {}

  async findAll(
    user: AuthUser,
    filters: TaskFiltersDto,
  ): Promise<PaginatedResponse<Task>> {
    const where = await this.scopedWhere(user);
    if (filters.status) where.status = filters.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.task.count({ where }),
    ]);
    return paginated(items, total, filters.page, filters.limit);
  }

  async create(user: AuthUser, dto: CreateTaskDto): Promise<Task> {
    const companyId = requireCompanyId(user);
    await this.ensureAssignable(user, companyId, dto.assignedToId);

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, companyId },
      });
      if (!lead) {
        throw new BusinessError(
          422,
          'El lead no pertenece a tu empresa',
          'BUSINESS_RULE_VIOLATION',
          'leadId',
        );
      }
    }

    const task = await this.prisma.task.create({
      data: {
        companyId,
        assignedToId: dto.assignedToId,
        createdById: user.id,
        leadId: dto.leadId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });

    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'task.created',
      targetId: task.id,
      targetType: 'Task',
    });

    // Notificar al vendedor asignado (si no es quien crea la tarea).
    if (dto.assignedToId !== user.id) {
      const lead = task.leadId
        ? await this.prisma.lead.findFirst({
            where: { id: task.leadId, companyId },
            select: { name: true },
          })
        : null;
      const context = lead ? ` en "${lead.name}"` : '';
      await this.notifs.notify([{
        companyId,
        userId: dto.assignedToId,
        type: 'TASK_ASSIGNED',
        title: `Nueva tarea asignada${context}`,
        body: `${user.username} te asignó: "${dto.title}"${dto.dueDate ? ' · Vence ' + new Date(dto.dueDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}`,
        leadId: task.leadId ?? undefined,
      }]);
    }

    return task;
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    await this.findScoped(user, id); // scope + 404
    const data: Prisma.TaskUpdateInput = {};
    if (dto.title) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.status) {
      data.status = dto.status;
      data.completedAt =
        dto.status === TaskStatus.COMPLETADA ? new Date() : null;
    }
    const updated = await this.prisma.task.update({ where: { id }, data });

    if (dto.status) {
      const companyId = requireCompanyId(user);
      await this.audit.record({
        companyId,
        actorId: user.id,
        actorRole: user.role,
        action: dto.status === TaskStatus.COMPLETADA ? 'task.completed' : 'task.status_changed',
        targetId: id,
        targetType: 'Task',
      });
    }

    return updated;
  }

  private async findScoped(user: AuthUser, id: string): Promise<Task> {
    const where = await this.scopedWhere(user);
    where.id = id;
    const task = await this.prisma.task.findFirst({ where });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  private async scopedWhere(user: AuthUser): Promise<Prisma.TaskWhereInput> {
    const companyId = requireCompanyId(user);
    const where: Prisma.TaskWhereInput = { companyId };

    if (user.role === Role.VENDEDOR) {
      where.assignedToId = user.id;
    } else if (user.role === Role.COORDINADOR) {
      const sellerIds = await this.getAssignedSellerIds(user.id);
      where.OR = [
        { assignedToId: { in: sellerIds.length ? sellerIds : [NO_MATCH] } },
        { createdById: user.id },
      ];
    }
    return where;
  }

  private async ensureAssignable(
    user: AuthUser,
    companyId: string,
    assignedToId: string,
  ): Promise<void> {
    const target = await this.prisma.user.findFirst({
      where: { id: assignedToId, companyId },
    });
    if (!target) {
      throw new BusinessError(
        422,
        'El usuario no pertenece a tu empresa',
        'BUSINESS_RULE_VIOLATION',
        'assignedToId',
      );
    }
    // Regla de negocio: el coordinador solo asigna tareas a sus vendedores.
    if (user.role === Role.COORDINADOR) {
      const link = await this.prisma.sellerAssignment.findFirst({
        where: { coordinatorId: user.id, sellerId: assignedToId },
      });
      if (!link) {
        throw new BusinessError(
          422,
          'Solo puedes asignar tareas a tus vendedores',
          'BUSINESS_RULE_VIOLATION',
          'assignedToId',
        );
      }
    }
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }
}
