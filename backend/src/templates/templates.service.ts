import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageTemplate, Prisma, Role } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthUser): Promise<MessageTemplate[]> {
    const companyId = requireCompanyId(user);
    const where: Prisma.MessageTemplateWhereInput = { companyId };
    // El ADMIN ve todas; el resto solo las activas (las que puede usar).
    if (user.role !== Role.ADMIN) where.isActive = true;
    return this.prisma.messageTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    user: AuthUser,
    dto: CreateTemplateDto,
  ): Promise<MessageTemplate> {
    const companyId = requireCompanyId(user);
    const template = await this.prisma.messageTemplate.create({
      data: {
        companyId,
        createdById: user.id,
        name: dto.name,
        body: dto.body,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'template.created',
      targetId: template.id,
      targetType: 'MessageTemplate',
    });
    return template;
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<MessageTemplate> {
    const companyId = requireCompanyId(user);
    const existing = await this.prisma.messageTemplate.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Plantilla no encontrada');
    const template = await this.prisma.messageTemplate.update({ where: { id }, data: dto });
    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'template.updated',
      targetId: id,
      targetType: 'MessageTemplate',
    });
    return template;
  }
}
