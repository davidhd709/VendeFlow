import {
  Body,
  Controller,
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
import { AuthUser } from '../common/types/auth-user';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalFiltersDto } from './dto/goal-filters.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService, GoalWithProgress } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly service: GoalsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  findAll(@CurrentUser() user: AuthUser, @Query() filters: GoalFiltersDto): Promise<GoalWithProgress[]> {
    return this.service.findAll(user, filters);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGoalDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.service.update(user, id, dto);
  }
}
