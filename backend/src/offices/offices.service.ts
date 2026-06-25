import { Injectable, NotFoundException } from '@nestjs/common';
import { Office } from '@prisma/client';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';

@Injectable()
export class OfficesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    user: AuthUser,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Office>> {
    const companyId = requireCompanyId(user);
    const where = { companyId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.office.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.office.count({ where }),
    ]);
    return paginated(items, total, pagination.page, pagination.limit);
  }

  async create(user: AuthUser, dto: CreateOfficeDto): Promise<Office> {
    const companyId = requireCompanyId(user);
    const office = await this.prisma.office.create({ data: { ...dto, companyId } });
    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'office.created',
      targetId: office.id,
      targetType: 'Office',
    });
    return office;
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateOfficeDto,
  ): Promise<Office> {
    const companyId = requireCompanyId(user);
    await this.ensureExists(companyId, id);
    const office = await this.prisma.office.update({ where: { id }, data: dto });
    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'office.updated',
      targetId: id,
      targetType: 'Office',
    });
    return office;
  }

  private async ensureExists(companyId: string, id: string): Promise<void> {
    const office = await this.prisma.office.findFirst({
      where: { id, companyId },
    });
    // 404 (no 403) ante un recurso de otro tenant.
    if (!office) throw new NotFoundException('Oficina no encontrada');
  }
}
