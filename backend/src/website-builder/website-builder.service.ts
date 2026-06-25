import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  WebsitePage,
  WebsitePageStatus,
  WebsiteSection,
  WebsiteSectionType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { BusinessError } from '../common/errors/business-error';
import { AuthUser } from '../common/types/auth-user';
import { requireCompanyId } from '../common/utils/require-company-id';
import { throwOnDuplicate } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SECTION_DATA, DEFAULT_SECTION_ORDER } from './defaults';
import { CreatePageDto } from './dto/create-page.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { validateSectionData } from './dto/section-data.dto';

const HOME_SLUG = 'home';
const HOME_TITLE = 'Inicio';

export interface PublishedSectionSnapshot {
  type: WebsiteSectionType;
  visible: boolean;
  data: Record<string, unknown>;
}

@Injectable()
export class WebsiteBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Páginas ───────────────────────────────────────────────────────

  async listPages(user: AuthUser): Promise<WebsitePage[]> {
    const companyId = requireCompanyId(user);
    // Asegura que toda empresa tenga al menos la `home`.
    await this.ensureHomePage(companyId);
    return this.prisma.websitePage.findMany({
      where: { companyId },
      orderBy: [{ slug: 'asc' }],
    });
  }

  async getPage(user: AuthUser, id: string) {
    const companyId = requireCompanyId(user);
    const page = await this.prisma.websitePage.findFirst({
      where: { id, companyId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!page) throw new NotFoundException('Página no encontrada');
    return page;
  }

  async createPage(user: AuthUser, dto: CreatePageDto): Promise<WebsitePage> {
    const companyId = requireCompanyId(user);
    try {
      return await this.prisma.websitePage.create({
        data: { companyId, slug: dto.slug, title: dto.title },
      });
    } catch (error) {
      throwOnDuplicate(error, 'Ya existe una página con ese slug', 'slug');
    }
  }

  async updatePage(
    user: AuthUser,
    id: string,
    dto: UpdatePageDto,
  ): Promise<WebsitePage> {
    const companyId = requireCompanyId(user);
    const existing = await this.prisma.websitePage.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Página no encontrada');
    try {
      return await this.prisma.websitePage.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throwOnDuplicate(error, 'Ya existe una página con ese slug', 'slug');
    }
  }

  async deletePage(user: AuthUser, id: string): Promise<{ success: true }> {
    const companyId = requireCompanyId(user);
    const existing = await this.prisma.websitePage.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Página no encontrada');
    if (existing.slug === HOME_SLUG) {
      throw new BusinessError(
        422,
        'La página "home" no se puede eliminar',
        'BUSINESS_RULE_VIOLATION',
        'slug',
      );
    }
    await this.prisma.websitePage.delete({ where: { id } });
    return { success: true };
  }

  // ─── Secciones ─────────────────────────────────────────────────────

  async createSection(
    user: AuthUser,
    pageId: string,
    dto: CreateSectionDto,
  ): Promise<WebsiteSection> {
    const companyId = requireCompanyId(user);
    const page = await this.prisma.websitePage.findFirst({
      where: { id: pageId, companyId },
    });
    if (!page) throw new NotFoundException('Página no encontrada');

    const rawData = dto.data ?? DEFAULT_SECTION_DATA[dto.type];
    const data = await validateSectionData(dto.type, rawData);

    // Nueva sección al final.
    const last = await this.prisma.websiteSection.aggregate({
      where: { pageId },
      _max: { order: true },
    });
    const order = (last._max.order ?? -1) + 1;

    return this.prisma.websiteSection.create({
      data: {
        companyId,
        pageId,
        type: dto.type,
        order,
        visible: dto.visible ?? true,
        data: data as Prisma.InputJsonValue,
      },
    });
  }

  async updateSection(
    user: AuthUser,
    id: string,
    dto: UpdateSectionDto,
  ): Promise<WebsiteSection> {
    const companyId = requireCompanyId(user);
    const existing = await this.prisma.websiteSection.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Sección no encontrada');

    const data: Prisma.WebsiteSectionUncheckedUpdateInput = {};
    if (dto.data !== undefined) {
      const validated = await validateSectionData(existing.type, dto.data);
      data.data = validated as Prisma.InputJsonValue;
    }
    if (dto.visible !== undefined) data.visible = dto.visible;
    if (dto.order !== undefined) data.order = dto.order;

    return this.prisma.websiteSection.update({ where: { id }, data });
  }

  async deleteSection(
    user: AuthUser,
    id: string,
  ): Promise<{ success: true }> {
    const companyId = requireCompanyId(user);
    const existing = await this.prisma.websiteSection.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Sección no encontrada');
    await this.prisma.websiteSection.delete({ where: { id } });
    return { success: true };
  }

  async reorderSections(
    user: AuthUser,
    pageId: string,
    dto: ReorderSectionsDto,
  ): Promise<WebsiteSection[]> {
    const companyId = requireCompanyId(user);
    const page = await this.prisma.websitePage.findFirst({
      where: { id: pageId, companyId },
    });
    if (!page) throw new NotFoundException('Página no encontrada');

    // Valida que TODOS los ids pertenecen a la página y que están todos.
    const sections = await this.prisma.websiteSection.findMany({
      where: { pageId },
      select: { id: true },
    });
    const currentSet = new Set(sections.map((s) => s.id));
    const requestSet = new Set(dto.sectionIds);
    if (
      currentSet.size !== requestSet.size ||
      dto.sectionIds.some((id) => !currentSet.has(id))
    ) {
      throw new BusinessError(
        422,
        'El listado de secciones no coincide con la página',
        'BUSINESS_RULE_VIOLATION',
        'sectionIds',
      );
    }

    await this.prisma.$transaction(
      dto.sectionIds.map((id, idx) =>
        this.prisma.websiteSection.update({
          where: { id },
          data: { order: idx },
        }),
      ),
    );
    return this.prisma.websiteSection.findMany({
      where: { pageId },
      orderBy: { order: 'asc' },
    });
  }

  // ─── Publish / Unpublish ───────────────────────────────────────────

  async publish(user: AuthUser, pageId: string): Promise<WebsitePage> {
    const companyId = requireCompanyId(user);
    const page = await this.prisma.websitePage.findFirst({
      where: { id: pageId, companyId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!page) throw new NotFoundException('Página no encontrada');

    const snapshot: PublishedSectionSnapshot[] = page.sections
      .filter((s) => s.visible)
      .map((s) => ({
        type: s.type,
        visible: true,
        data: (s.data ?? {}) as Record<string, unknown>,
      }));

    const updated = await this.prisma.websitePage.update({
      where: { id: pageId },
      data: {
        status: WebsitePageStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      companyId,
      actorId: user.id,
      actorRole: user.role,
      action: 'page.published',
      targetId: pageId,
      targetType: 'WebsitePage',
      metadata: { slug: page.slug, sections: snapshot.length },
    });

    return updated;
  }

  async unpublish(user: AuthUser, pageId: string): Promise<WebsitePage> {
    const companyId = requireCompanyId(user);
    const page = await this.prisma.websitePage.findFirst({
      where: { id: pageId, companyId },
    });
    if (!page) throw new NotFoundException('Página no encontrada');

    return this.prisma.websitePage.update({
      where: { id: pageId },
      data: {
        status: WebsitePageStatus.DRAFT,
        // Conservamos publishedSnapshot por si quieren re-publicar lo mismo.
      },
    });
  }

  /** Devuelve los datos del DRAFT actual (preview admin). */
  async preview(user: AuthUser, pageId: string) {
    return this.getPage(user, pageId);
  }

  // ─── Lectura pública ───────────────────────────────────────────────

  /**
   * Devuelve la página publicada por slug de empresa + slug de página.
   * Si la empresa no tiene página publicada, devuelve null (el caller
   * arma el fallback desde WebsiteConfig).
   */
  async getPublishedBySubdomain(
    subdomain: string,
    pageSlug: string = HOME_SLUG,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { subdomain },
    });
    if (!company || company.status === 'SUSPENDED') return null;

    const page = await this.prisma.websitePage.findFirst({
      where: {
        companyId: company.id,
        slug: pageSlug,
        status: WebsitePageStatus.PUBLISHED,
      },
    });
    if (!page || !page.publishedSnapshot) return null;

    return {
      slug: page.slug,
      title: page.title,
      publishedAt: page.publishedAt,
      sections: page.publishedSnapshot as unknown as PublishedSectionSnapshot[],
    };
  }

  // ─── Lazy-create de home (a partir de WebsiteConfig) ───────────────

  /**
   * Garantiza que la empresa tenga su página `home`. Si no existe, la crea
   * sembrada con secciones por defecto + valores del WebsiteConfig actual
   * (logo/banners/services/faq/contacto), para que el ADMIN entre y vea
   * algo profesional desde el primer momento.
   */
  private async ensureHomePage(companyId: string): Promise<void> {
    const existing = await this.prisma.websitePage.findFirst({
      where: { companyId, slug: HOME_SLUG },
    });
    if (existing) return;

    const config = await this.prisma.websiteConfig.findUnique({
      where: { companyId },
    });

    await this.prisma.$transaction(async (tx) => {
      const page = await tx.websitePage.create({
        data: {
          companyId,
          slug: HOME_SLUG,
          title: HOME_TITLE,
        },
      });

      // Semilla con tipos por defecto, mezclando WebsiteConfig si lo hay.
      const banners = (config?.banners as unknown as
        | { imageUrl?: string }[]
        | null) ?? null;
      const heroImage = banners?.[0]?.imageUrl;

      const dataByType: Partial<Record<WebsiteSectionType, Record<string, unknown>>> = {
        HERO: {
          ...DEFAULT_SECTION_DATA.HERO,
          ...(config?.heroTitle ? { title: config.heroTitle } : {}),
          ...(config?.heroSubtitle ? { subtitle: config.heroSubtitle } : {}),
          ...(heroImage ? { imageUrl: heroImage } : {}),
        },
        SERVICES: this.mergeListData('SERVICES', config?.services as unknown[]),
        FAQ: this.mergeListData('FAQ', config?.faq as unknown[]),
        CONTACT: {
          ...DEFAULT_SECTION_DATA.CONTACT,
          ...(config?.contactPhone ? { phone: config.contactPhone } : {}),
          ...(config?.contactEmail ? { email: config.contactEmail } : {}),
          ...(config?.address ? { address: config.address } : {}),
          useCompanyContact: !config?.contactPhone && !config?.contactEmail,
        },
      };

      let order = 0;
      for (const type of DEFAULT_SECTION_ORDER) {
        const data = dataByType[type] ?? DEFAULT_SECTION_DATA[type];
        await tx.websiteSection.create({
          data: {
            companyId,
            pageId: page.id,
            type,
            order: order++,
            visible: true,
            data: data as Prisma.InputJsonValue,
          },
        });
      }
    });
  }

  /** Combina items existentes en WebsiteConfig con los defaults del tipo. */
  private mergeListData(
    type: WebsiteSectionType,
    items: unknown[] | null | undefined,
  ): Record<string, unknown> {
    const base = DEFAULT_SECTION_DATA[type];
    if (Array.isArray(items) && items.length > 0) {
      return { ...base, items };
    }
    return base;
  }
}
