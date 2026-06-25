import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import {
  paginated,
  PaginatedResponse,
} from '../common/dto/paginated-response';
import { AuthUser } from '../common/types/auth-user';
import { throwOnDuplicate } from '../common/utils/prisma-errors';
import { requireCompanyId } from '../common/utils/require-company-id';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    user: AuthUser,
    filters: ProductFiltersDto,
  ): Promise<PaginatedResponse<Product>> {
    const companyId = requireCompanyId(user);
    const where: Prisma.ProductWhereInput = { companyId };
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.activeOnly) where.isActive = true;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginated(items, total, filters.page, filters.limit);
  }

  async findOne(user: AuthUser, id: string): Promise<Product> {
    const companyId = requireCompanyId(user);
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(user: AuthUser, dto: CreateProductDto): Promise<Product> {
    const companyId = requireCompanyId(user);
    try {
      const product = await this.prisma.product.create({
        data: { ...dto, companyId },
      });
      await this.audit.record({
        companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'product.created',
        targetId: product.id,
        targetType: 'Product',
      });
      return product;
    } catch (error) {
      throwOnDuplicate(error, 'Ya existe un producto con ese slug', 'slug');
    }
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const companyId = requireCompanyId(user);
    await this.findOne(user, id);
    try {
      const product = await this.prisma.product.update({ where: { id }, data: dto });
      await this.audit.record({
        companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'product.updated',
        targetId: id,
        targetType: 'Product',
      });
      return product;
    } catch (error) {
      throwOnDuplicate(error, 'Ya existe un producto con ese slug', 'slug');
    }
  }
}
