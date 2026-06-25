import { Injectable } from '@nestjs/common';
import { Prisma, WebsiteConfig } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWebsiteConfigDto } from './dto/update-website-config.dto';

@Injectable()
export class WebsiteConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getMine(user: AuthUser): Promise<WebsiteConfig | null> {
    const companyId = requireCompanyId(user);
    return this.prisma.websiteConfig.findUnique({ where: { companyId } });
  }

  async upsert(
    user: AuthUser,
    dto: UpdateWebsiteConfigDto,
  ): Promise<WebsiteConfig> {
    const companyId = requireCompanyId(user);
    const data: Prisma.WebsiteConfigUncheckedUpdateInput = {};
    if (dto.heroTitle !== undefined) data.heroTitle = dto.heroTitle;
    if (dto.heroSubtitle !== undefined) data.heroSubtitle = dto.heroSubtitle;
    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;
    if (dto.banners !== undefined)
      data.banners = dto.banners as Prisma.InputJsonValue;
    if (dto.services !== undefined)
      data.services = dto.services as Prisma.InputJsonValue;
    if (dto.faq !== undefined) data.faq = dto.faq as Prisma.InputJsonValue;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail;
    if (dto.address !== undefined) data.address = dto.address;

    const config = await this.prisma.websiteConfig.upsert({
      where: { companyId },
      create: { companyId, ...data } as Prisma.WebsiteConfigUncheckedCreateInput,
      update: data,
    });

    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'website_config.updated',
      targetId: companyId,
      targetType: 'WebsiteConfig',
    });

    return config;
  }

  async getBySubdomain(subdomain: string): Promise<WebsiteConfig | null> {
    const company = await this.prisma.company.findUnique({
      where: { subdomain },
    });
    if (!company || company.status === 'SUSPENDED') return null;
    return this.prisma.websiteConfig.findUnique({
      where: { companyId: company.id },
    });
  }

}
