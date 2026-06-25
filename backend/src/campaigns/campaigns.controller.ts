import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthUser } from '../common/types/auth-user';
import { CampaignsService, ReactivationType } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  /** Sugerencias de clientes para campañas de reactivación (solo ADMIN). */
  @Get('reactivation')
  @Roles(Role.ADMIN)
  getReactivation(
    @CurrentUser() user: AuthUser,
    @Query('type') type: ReactivationType,
  ) {
    return this.service.getReactivationSuggestions(user, type);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(user, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.VENDEDOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.service.create(user, dto);
  }
}
