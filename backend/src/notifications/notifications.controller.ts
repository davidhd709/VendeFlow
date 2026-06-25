import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  getRecent(@CurrentUser() user: AuthUser) {
    return this.service.getRecent(user);
  }

  @Patch('read-all')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.service.markAllRead(user);
  }

  @Patch(':id/read')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  markOneRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.markOneRead(user, id);
  }
}
