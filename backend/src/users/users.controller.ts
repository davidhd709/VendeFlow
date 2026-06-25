import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserFiltersDto } from './dto/user-filters.dto';
import { AuthUser } from '../common/types/auth-user';
import { AssignOfficeDto } from './dto/assign-office.dto';
import { AssignSellerDto } from './dto/assign-seller.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findAll(@CurrentUser() user: AuthUser, @Query() filters: UserFiltersDto) {
    return this.service.findAll(user, filters);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Patch(':id/password')
  resetPassword(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.resetPassword(user, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.service.updateStatus(user, id, dto.isActive);
  }

  // Asignación de vendedores a un coordinador.
  @Get(':id/sellers')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  listSellers(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) coordinatorId: string,
  ) {
    return this.service.listAssignedSellers(user, coordinatorId);
  }

  @Post(':id/sellers')
  @Roles(Role.ADMIN)
  assignSeller(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) coordinatorId: string,
    @Body() dto: AssignSellerDto,
  ) {
    return this.service.assignSeller(user, coordinatorId, dto.sellerId);
  }

  @Delete(':id/sellers/:sellerId')
  @Roles(Role.ADMIN)
  unassignSeller(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) coordinatorId: string,
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
  ) {
    return this.service.unassignSeller(user, coordinatorId, sellerId);
  }

  // Asignación de oficinas a un coordinador.
  @Get(':id/offices')
  listCoordinatorOffices(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) coordinatorId: string,
  ) {
    return this.service.listCoordinatorOffices(user, coordinatorId);
  }

  @Post(':id/offices')
  assignOffice(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) coordinatorId: string,
    @Body() dto: AssignOfficeDto,
  ) {
    return this.service.assignOffice(user, coordinatorId, dto.officeId);
  }

  @Delete(':id/offices/:officeId')
  unassignOffice(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) coordinatorId: string,
    @Param('officeId', ParseUUIDPipe) officeId: string,
  ) {
    return this.service.unassignOffice(user, coordinatorId, officeId);
  }
}
