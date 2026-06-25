import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { WebsiteConfigService } from '../website-config/website-config.service';
import { WebsiteBuilderService } from './website-builder.service';

/**
 * Endpoint público que consume la web pública (frontend `/sitio`).
 *
 * - `theme` viene de `WebsiteConfig` (logo, color, contacto).
 * - `page` viene del snapshot publicado del Website Builder.
 *
 * Si la empresa aún no publicó una página, `page` es null y el frontend
 * cae al render heredado de WebsiteConfig (fallback automático sin downtime).
 */
@ApiTags('public-website')
@Public()
@Controller('public/website')
export class PublicWebsiteController {
  constructor(
    private readonly builder: WebsiteBuilderService,
    private readonly config: WebsiteConfigService,
  ) {}

  @Get(':subdomain')
  async getWebsite(@Param('subdomain') subdomain: string) {
    const [theme, page] = await Promise.all([
      this.config.getBySubdomain(subdomain),
      this.builder.getPublishedBySubdomain(subdomain),
    ]);

    // Si NI siquiera la empresa existe, devolvemos 404. Si existe pero no
    // tiene config ni página publicada, devolvemos page: null y dejamos
    // que el frontend muestre defaults.
    if (!theme && !page) {
      // El config service ya devuelve null si la empresa no existe; el
      // builder service también. Para distinguir, intentamos otra vez.
      const exists = await this.config.getBySubdomain(subdomain);
      if (!exists) throw new NotFoundException('Empresa no encontrada');
    }

    return { theme, page };
  }

  @Get(':subdomain/:pageSlug')
  async getPage(
    @Param('subdomain') subdomain: string,
    @Param('pageSlug') pageSlug: string,
  ) {
    const [theme, page] = await Promise.all([
      this.config.getBySubdomain(subdomain),
      this.builder.getPublishedBySubdomain(subdomain, pageSlug),
    ]);
    return { theme, page };
  }
}
