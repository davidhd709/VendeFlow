import { NotFoundException } from '@nestjs/common';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { PrismaService } from '../prisma/prisma.service';
import { PublicService } from './public.service';

const pagination = { page: 1, limit: 20, skip: 0, take: 20 } as never;

const makeCompany = (overrides: Record<string, unknown> = {}) => ({
  id: 'company-A',
  name: 'Celulares Plus',
  slug: 'celulares-plus',
  subdomain: 'celulares-plus',
  status: 'ACTIVE',
  ...overrides,
});

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  name: 'iPhone 15',
  slug: 'iphone-15',
  description: 'El mejor iPhone',
  brand: 'Apple',
  model: 'iPhone 15',
  ram: '6GB',
  storage: '128GB',
  color: 'Negro',
  condition: 'NUEVO',
  warranty: '12 meses',
  price: '3500000',
  imageUrl: null,
  images: [],
  ...overrides,
});

describe('PublicService — seguridad y aislamiento público', () => {
  let service: PublicService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (arg: unknown) => (Array.isArray(arg) ? Promise.all(arg) : (arg as (p: unknown) => unknown)(prisma)),
    );
    service = new PublicService(prisma as unknown as PrismaService);
  });

  // ─── resolveCompany (implícito en todos los métodos) ──────────────────

  it('getCompany lanza 404 si el subdominio no existe', async () => {
    prisma.company.findUnique.mockResolvedValue(null as never);

    await expect(service.getCompany('inexistente')).rejects.toThrow(NotFoundException);
  });

  it('getCompany lanza 404 si la empresa está SUSPENDED', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany({ status: 'SUSPENDED' }) as never);

    await expect(service.getCompany('celulares-plus')).rejects.toThrow(NotFoundException);
  });

  it('getCompany devuelve solo campos públicos seguros (sin status, createdAt, etc.)', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);

    const result = await service.getCompany('celulares-plus');

    expect(result).toEqual({ id: 'company-A', name: 'Celulares Plus', slug: 'celulares-plus', subdomain: 'celulares-plus' });
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('createdAt');
  });

  // ─── getProducts ──────────────────────────────────────────────────────

  it('getProducts filtra por companyId e isActive: true', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);
    prisma.product.findMany.mockResolvedValue([makeProduct()] as never);
    prisma.product.count.mockResolvedValue(1 as never);

    await service.getProducts('celulares-plus', pagination);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 'company-A', isActive: true },
      }),
    );
  });

  it('getProducts lanza 404 si la empresa está SUSPENDED', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany({ status: 'SUSPENDED' }) as never);

    await expect(service.getProducts('celulares-plus', pagination)).rejects.toThrow(NotFoundException);
  });

  // ─── getProductBySlug ─────────────────────────────────────────────────

  it('getProductBySlug filtra por companyId, slug e isActive: true', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);
    prisma.product.findFirst.mockResolvedValue(makeProduct() as never);

    await service.getProductBySlug('celulares-plus', 'iphone-15');

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 'company-A', slug: 'iphone-15', isActive: true },
      }),
    );
  });

  it('getProductBySlug lanza 404 si el producto no existe', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);
    prisma.product.findFirst.mockResolvedValue(null as never);

    await expect(service.getProductBySlug('celulares-plus', 'no-existe')).rejects.toThrow(NotFoundException);
  });

  // ─── getOffices ───────────────────────────────────────────────────────

  it('getOffices filtra por companyId e isActive: true', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany() as never);
    prisma.office.findMany.mockResolvedValue([] as never);

    await service.getOffices('celulares-plus');

    expect(prisma.office.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: 'company-A', isActive: true },
      }),
    );
  });

  it('getOffices lanza 404 si la empresa está SUSPENDED', async () => {
    prisma.company.findUnique.mockResolvedValue(makeCompany({ status: 'SUSPENDED' }) as never);

    await expect(service.getOffices('celulares-plus')).rejects.toThrow(NotFoundException);
  });
});
