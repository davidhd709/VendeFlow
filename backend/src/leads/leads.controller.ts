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
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ImportLeadsDto } from './dto/import-leads.dto';
import { LeadFiltersDto } from './dto/lead-filters.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  findAll(@CurrentUser() user: AuthUser, @Query() filters: LeadFiltersDto) {
    return this.service.findAll(user, filters);
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
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeadDto) {
    return this.service.create(user, dto);
  }

  @Post('import')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  importLeads(@CurrentUser() user: AuthUser, @Body() dto: ImportLeadsDto) {
    return this.service.importLeads(user, dto);
  }

  @Patch(':id/seller')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  assignSeller(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('sellerId') sellerId: string | null,
  ) {
    return this.service.assignSeller(user, id, sellerId ?? null);
  }

  @Patch(':id/status')
  @Roles(Role.VENDEDOR, Role.COORDINADOR)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.service.updateStatus(user, id, dto.status);
  }

  @Get(':id/follow-ups')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  getFollowUps(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getFollowUps(user, id);
  }

  @Post(':id/follow-ups')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  addFollowUp(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.service.addFollowUp(user, id, dto);
  }

  @Get(':id/comments')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  getComments(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getComments(user, id);
  }

  @Post(':id/comments')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  addComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(user, id, dto.body);
  }

  @Get(':id/status-history')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  getStatusHistory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getStatusHistory(user, id);
  }

  @Get(':id/tasks')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  getTasks(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getTasksForLead(user, id);
  }
}
