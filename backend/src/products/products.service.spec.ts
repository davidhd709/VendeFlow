import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const filters = { page: 1, limit: 20, skip: 0, take: 20, search: undefined, activeOnly: false } as never;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  companyId: 'company-A',
  name: 'iPhone 15',
  slug: 'iphone-15',
  description: null,
  price: '3500000',
  imageUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProductsService — tenant isolation & audit', () => {
  let service: ProductsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : (arg as () => unknown)(),
    );
    service = new ProductsService(prisma as unknown as PrismaService, auditMock);
  });

  // ─── findAll ──────────────────────────────────────────────────────────

  it('findAll incluye siempre companyId del token en el where', async () => {
    prisma.product.findMany.mockResolvedValue([] as never);
    prisma.product.count.mockResolvedValue(0 as never);

    await service.findAll(makeUser(), filters);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('findAll filtra por nombre si se indica search', async () => {
    prisma.product.findMany.mockResolvedValue([] as never);
    prisma.product.count.mockResolvedValue(0 as never);

    const searchFilters = { page: 1, limit: 20, skip: 0, take: 20, search: 'iphone', activeOnly: false } as never;
    await service.findAll(makeUser(), searchFilters);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'iphone', mode: 'insensitive' },
        }),
      }),
    );
  });

  // ─── findOne ──────────────────────────────────────────────────────────

  it('findOne lanza 404 si el producto no pertenece a la empresa', async () => {
    prisma.product.findFirst.mockResolvedValue(null as never);

    await expect(
      service.findOne(makeUser(), 'prod-otro-tenant'),
    ).rejects.toThrow(NotFoundException);
  });

  it('findOne incluye companyId del token en el where', async () => {
    prisma.product.findFirst.mockResolvedValue(makeProduct() as never);

    await service.findOne(makeUser(), 'prod-1');

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A', id: 'prod-1' }),
      }),
    );
  });

  // ─── create ───────────────────────────────────────────────────────────

  it('create inyecta companyId del token (nunca del body)', async () => {
    prisma.product.create.mockResolvedValue(makeProduct() as never);

    await service.create(makeUser(), {
      name: 'Samsung S24',
      slug: 'samsung-s24',
      price: 2_500_000,
    });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('create registra audit log product.created', async () => {
    prisma.product.create.mockResolvedValue(makeProduct() as never);

    await service.create(makeUser(), {
      name: 'Samsung S24',
      slug: 'samsung-s24',
      price: 2_500_000,
    });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'product.created', targetType: 'Product' }),
    );
  });

  // ─── update ───────────────────────────────────────────────────────────

  it('update lanza 404 si el producto no es de la empresa', async () => {
    prisma.product.findFirst.mockResolvedValue(null as never);

    await expect(
      service.update(makeUser(), 'prod-otro-tenant', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('update registra audit log product.updated', async () => {
    prisma.product.findFirst.mockResolvedValue(makeProduct() as never);
    prisma.product.update.mockResolvedValue(makeProduct({ name: 'iPhone 15 Pro' }) as never);

    await service.update(makeUser(), 'prod-1', { name: 'iPhone 15 Pro' });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'product.updated', targetType: 'Product' }),
    );
  });
});
