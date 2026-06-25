import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreatePublicLeadDto } from '../leads/dto/create-public-lead.dto';
import { LeadsService } from '../leads/leads.service';
import { WebsiteConfigService } from '../website-config/website-config.service';
import { PublicService } from './public.service';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly leadsService: LeadsService,
    private readonly websiteConfig: WebsiteConfigService,
  ) {}

  @Get(':subdomain/website-config')
  getWebsiteConfig(@Param('subdomain') subdomain: string) {
    return this.websiteConfig.getBySubdomain(subdomain);
  }

  @Get('companies/by-subdomain/:subdomain')
  getCompany(@Param('subdomain') subdomain: string) {
    return this.publicService.getCompany(subdomain);
  }

  @Get(':subdomain/products')
  getProducts(
    @Param('subdomain') subdomain: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.publicService.getProducts(subdomain, pagination);
  }

  @Get(':subdomain/products/:slug')
  getProduct(
    @Param('subdomain') subdomain: string,
    @Param('slug') slug: string,
  ) {
    return this.publicService.getProductBySlug(subdomain, slug);
  }

  @Get(':subdomain/offices')
  getOffices(@Param('subdomain') subdomain: string) {
    return this.publicService.getOffices(subdomain);
  }

  @Post('leads')
  createLead(@Body() dto: CreatePublicLeadDto) {
    return this.leadsService.createFromPublic(dto);
  }
}
