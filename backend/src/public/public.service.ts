import { Injectable, NotFoundException } from '@nestjs/common';
import { Company } from '@prisma/client';
import { paginated } from '../common/dto/paginated-response';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

// Campos del producto seguros para exponer en la web pública.
const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  brand: true,
  model: true,
  ram: true,
  storage: true,
  color: true,
  condition: true,
  warranty: true,
  price: true,
  imageUrl: true,
  images: true,
} as const;

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompany(subdomain: string) {
    const company = await this.resolveCompany(subdomain);
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      subdomain: company.subdomain,
    };
  }

  async getProducts(subdomain: string, pagination: PaginationDto) {
    const company = await this.resolveCompany(subdomain);
    const where = { companyId: company.id, isActive: true };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: PUBLIC_PRODUCT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginated(items, total, pagination.page, pagination.limit);
  }

  async getProductBySlug(subdomain: string, slug: string) {
    const company = await this.resolveCompany(subdomain);
    const product = await this.prisma.product.findFirst({
      where: { companyId: company.id, slug, isActive: true },
      select: PUBLIC_PRODUCT_SELECT,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async getOffices(subdomain: string) {
    const company = await this.resolveCompany(subdomain);
    return this.prisma.office.findMany({
      where: { companyId: company.id, isActive: true },
      select: { id: true, name: true, address: true, city: true, phone: true },
      orderBy: { name: 'asc' },
    });
  }

  private async resolveCompany(subdomain: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { subdomain },
    });
    if (!company || company.status === 'SUSPENDED') {
      throw new NotFoundException('Empresa no encontrada');
    }
    return company;
  }
}
