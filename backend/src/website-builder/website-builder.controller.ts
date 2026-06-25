import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreatePageDto } from './dto/create-page.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { WebsiteBuilderService } from './website-builder.service';

@ApiTags('website-builder')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('website-builder')
export class WebsiteBuilderController {
  constructor(private readonly service: WebsiteBuilderService) {}

  // ─── Páginas ──────────────────────────────────────────────────────

  @Get('pages')
  listPages(@CurrentUser() user: AuthUser) {
    return this.service.listPages(user);
  }

  @Post('pages')
  createPage(@CurrentUser() user: AuthUser, @Body() dto: CreatePageDto) {
    return this.service.createPage(user, dto);
  }

  @Get('pages/:id')
  getPage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getPage(user, id);
  }

  @Patch('pages/:id')
  updatePage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.service.updatePage(user, id, dto);
  }

  @Delete('pages/:id')
  deletePage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.deletePage(user, id);
  }

  // ─── Secciones ────────────────────────────────────────────────────

  @Post('pages/:id/sections')
  createSection(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) pageId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.service.createSection(user, pageId, dto);
  }

  @Patch('sections/:id')
  updateSection(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.service.updateSection(user, id, dto);
  }

  @Delete('sections/:id')
  deleteSection(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.deleteSection(user, id);
  }

  @Patch('pages/:id/reorder')
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) pageId: string,
    @Body() dto: ReorderSectionsDto,
  ) {
    return this.service.reorderSections(user, pageId, dto);
  }

  // ─── Publish / Preview ────────────────────────────────────────────

  @Post('pages/:id/publish')
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.publish(user, id);
  }

  @Post('pages/:id/unpublish')
  unpublish(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.unpublish(user, id);
  }

  @Get('preview/:id')
  preview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.preview(user, id);
  }
}
