import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { throwOnDuplicate } from '../common/utils/prisma-errors';
import { requireCompanyId } from '../common/utils/require-company-id';
import { SafeUser, sanitizeUser } from '../common/utils/sanitize-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

const ASSIGNABLE_ROLES: Role[] = [Role.COORDINADOR, Role.VENDEDOR];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    user: AuthUser,
    filters: UserFiltersDto,
  ): Promise<PaginatedResponse<SafeUser>> {
    const companyId = requireCompanyId(user);
    const where: Prisma.UserWhereInput = { companyId };

    if (filters.role) where.role = filters.role;
    if (filters.officeId) where.officeId = filters.officeId;

    // COORDINADOR solo puede ver sus vendedores asignados
    if (user.role === Role.COORDINADOR) {
      const sellerIds = await this.getAssignedSellerIds(user.id);
      where.id = { in: sellerIds.length ? sellerIds : ['__no_match__'] };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(
      items.map(sanitizeUser),
      total,
      filters.page,
      filters.limit,
    );
  }

  async create(
    user: AuthUser,
    dto: CreateUserDto,
  ): Promise<{ user: SafeUser; tempPassword: string }> {
    const companyId = requireCompanyId(user);
    this.assertAssignableRole(dto.role);
    if (dto.officeId) await this.ensureOffice(companyId, dto.officeId);

    const existing = await this.prisma.user.findFirst({
      where: { companyId, username: dto.username },
    });
    if (existing) {
      throw new BusinessError(
        409,
        'El nombre de usuario ya existe en esta empresa',
        'CONFLICT',
        'username',
      );
    }

    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    try {
      const created = await this.prisma.user.create({
        data: {
          username: dto.username,
          passwordHash,
          name: dto.name,
          email: dto.email,
          role: dto.role,
          officeId: dto.officeId,
          companyId,
          mustChangePassword: true,
        },
      });
      await this.audit.record({
        companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'user.created',
        targetId: created.id,
        targetType: 'User',
      });
      return { user: sanitizeUser(created), tempPassword };
    } catch (error) {
      throwOnDuplicate(
        error,
        'El nombre de usuario ya existe en esta empresa',
        'username',
      );
    }
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<SafeUser> {
    const companyId = requireCompanyId(user);
    const target = await this.ensureExists(companyId, id);
    if (dto.role) this.assertAssignableRole(dto.role);
    if (dto.officeId) await this.ensureOffice(companyId, dto.officeId);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    if (dto.role && dto.role !== target.role) {
      await this.audit.record({
        companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'user.role_changed',
        targetId: id,
        targetType: 'User',
      });
    }
    return sanitizeUser(updated);
  }

  async changeMyPassword(
    user: AuthUser,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new NotFoundException('Usuario no encontrado');
    const ok = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!ok) throw new BusinessError(422, 'La contraseña actual es incorrecta', 'WRONG_PASSWORD', 'currentPassword');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    if (dbUser.companyId) {
      await this.audit.record({
        companyId: dbUser.companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'user.password_changed',
        targetId: user.id,
        targetType: 'User',
      });
    }
    return { success: true };
  }

  async resetPassword(
    user: AuthUser,
    id: string,
  ): Promise<{ tempPassword: string }> {
    const companyId = requireCompanyId(user);
    await this.ensureExists(companyId, id);
    const tempPassword = randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true } });
    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'user.password_reset',
      targetId: id,
      targetType: 'User',
    });
    return { tempPassword };
  }

  async forceChangePassword(
    userId: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    if (!newPassword || newPassword.length < 6)
      throw new BusinessError(422, 'La contraseña debe tener al menos 6 caracteres', 'VALIDATION_ERROR', 'newPassword');
    const dbUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) throw new NotFoundException('Usuario no encontrado');
    if (!dbUser.mustChangePassword)
      throw new BusinessError(422, 'No tienes un cambio de contraseña pendiente', 'BUSINESS_RULE_VIOLATION');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: false } });
    if (dbUser.companyId) {
      await this.audit.record({
        companyId: dbUser.companyId,
        actorId: userId,
        actorRole: dbUser.role,
        action: 'user.password_force_changed',
        targetId: userId,
        targetType: 'User',
      });
    }
    return { success: true };
  }

  async updateStatus(
    user: AuthUser,
    id: string,
    isActive: boolean,
  ): Promise<SafeUser> {
    const companyId = requireCompanyId(user);
    await this.ensureExists(companyId, id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
    return sanitizeUser(updated);
  }

  private assertAssignableRole(role: Role): void {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new BusinessError(
        422,
        'Solo puedes crear o asignar roles COORDINADOR o VENDEDOR',
        'BUSINESS_RULE_VIOLATION',
        'role',
      );
    }
  }

  private async ensureExists(companyId: string, id: string): Promise<User> {
    const target = await this.prisma.user.findFirst({
      where: { id, companyId },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    return target;
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

  // ─── Asignación vendedor ↔ coordinador (Fase 3) ──────────────────────

  async listAssignedSellers(
    user: AuthUser,
    coordinatorId: string,
  ): Promise<SafeUser[]> {
    const companyId = requireCompanyId(user);
    // El COORDINADOR solo consulta su propia lista.
    if (user.role === Role.COORDINADOR && user.id !== coordinatorId) {
      throw new NotFoundException('Coordinador no encontrado');
    }
    await this.ensureCoordinator(companyId, coordinatorId);
    const links = await this.prisma.sellerAssignment.findMany({
      where: { companyId, coordinatorId },
      include: { seller: true },
    });
    return links.map((l) => sanitizeUser(l.seller));
  }

  async assignSeller(
    user: AuthUser,
    coordinatorId: string,
    sellerId: string,
  ): Promise<{ success: true }> {
    const companyId = requireCompanyId(user);
    await this.ensureCoordinator(companyId, coordinatorId);
    await this.ensureSeller(companyId, sellerId);
    try {
      await this.prisma.sellerAssignment.create({
        data: { companyId, coordinatorId, sellerId },
      });
    } catch (error) {
      throwOnDuplicate(
        error,
        'El vendedor ya está asignado a este coordinador',
      );
    }
    return { success: true };
  }

  async unassignSeller(
    user: AuthUser,
    coordinatorId: string,
    sellerId: string,
  ): Promise<{ success: true }> {
    const companyId = requireCompanyId(user);
    await this.prisma.sellerAssignment.deleteMany({
      where: { companyId, coordinatorId, sellerId },
    });
    return { success: true };
  }

  // ─── Asignación coordinador ↔ oficinas ───────────────────────────────

  async listCoordinatorOffices(
    user: AuthUser,
    coordinatorId: string,
  ): Promise<{ id: string; name: string; city: string | null; isActive: boolean }[]> {
    const companyId = requireCompanyId(user);
    await this.ensureCoordinator(companyId, coordinatorId);
    const links = await this.prisma.coordinatorOffice.findMany({
      where: { companyId, coordinatorId },
      include: { office: { select: { id: true, name: true, city: true, isActive: true } } },
      orderBy: { office: { name: 'asc' } },
    });
    return links.map((l) => l.office);
  }

  async assignOffice(
    user: AuthUser,
    coordinatorId: string,
    officeId: string,
  ): Promise<{ success: true }> {
    const companyId = requireCompanyId(user);
    await this.ensureCoordinator(companyId, coordinatorId);
    await this.ensureOffice(companyId, officeId);
    try {
      await this.prisma.coordinatorOffice.create({
        data: { companyId, coordinatorId, officeId },
      });
    } catch (error) {
      throwOnDuplicate(error, 'La oficina ya está asignada a este coordinador');
    }
    return { success: true };
  }

  async unassignOffice(
    user: AuthUser,
    coordinatorId: string,
    officeId: string,
  ): Promise<{ success: true }> {
    const companyId = requireCompanyId(user);
    await this.prisma.coordinatorOffice.deleteMany({
      where: { companyId, coordinatorId, officeId },
    });
    return { success: true };
  }

  private async ensureCoordinator(
    companyId: string,
    id: string,
  ): Promise<void> {
    const coordinator = await this.prisma.user.findFirst({
      where: { id, companyId, role: Role.COORDINADOR },
    });
    if (!coordinator) throw new NotFoundException('Coordinador no encontrado');
  }

  private async getAssignedSellerIds(coordinatorId: string): Promise<string[]> {
    const links = await this.prisma.sellerAssignment.findMany({
      where: { coordinatorId },
      select: { sellerId: true },
    });
    return links.map((l) => l.sellerId);
  }

  private async ensureSeller(companyId: string, id: string): Promise<void> {
    const seller = await this.prisma.user.findFirst({
      where: { id, companyId, role: Role.VENDEDOR },
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
}
