import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('company')
  @Roles(Role.ADMIN)
  company(@CurrentUser() user: AuthUser) {
    return this.service.companyMetrics(user);
  }

  @Get('seller/:sellerId')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  seller(
    @CurrentUser() user: AuthUser,
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
  ) {
    return this.service.sellerMetrics(user, sellerId);
  }

  @Get('me')
  @Roles(Role.VENDEDOR)
  me(@CurrentUser() user: AuthUser) {
    return this.service.meMetrics(user);
  }

  @Get('coordinator')
  @Roles(Role.COORDINADOR)
  coordinator(@CurrentUser() user: AuthUser) {
    return this.service.coordinatorMetrics(user);
  }
}
