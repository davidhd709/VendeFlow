import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleFiltersDto } from './dto/sale-filters.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  register(@CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto) {
    return this.service.registerSale(user, dto);
  }

  @Get('export')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  async exportCsv(
    @CurrentUser() user: AuthUser,
    @Query() filters: SaleFiltersDto,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportCsv(user, filters);
    const filename = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM para Excel
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.VENDEDOR)
  findAll(@CurrentUser() user: AuthUser, @Query() filters: SaleFiltersDto) {
    return this.service.findAll(user, filters);
  }
}
