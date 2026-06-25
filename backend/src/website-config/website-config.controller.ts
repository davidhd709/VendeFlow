import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { UpdateWebsiteConfigDto } from './dto/update-website-config.dto';
import { WebsiteConfigService } from './website-config.service';

@ApiTags('website-config')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('website-config')
export class WebsiteConfigController {
  constructor(private readonly service: WebsiteConfigService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.service.getMine(user);
  }

  @Put()
  upsert(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWebsiteConfigDto,
  ) {
    return this.service.upsert(user, dto);
  }
}
