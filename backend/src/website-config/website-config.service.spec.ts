import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { WebsiteConfigService } from './website-config.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

const makeConfig = (overrides: Record<string, unknown> = {}) => ({
  id: 'cfg-1',
  companyId: 'company-A',
  heroTitle: 'Bienvenidos',
  heroSubtitle: 'Celulares premium',
  primaryColor: '#2563eb',
  logoUrl: null,
  banners: [],
  services: [],
  faq: [],
  contactPhone: '+573001112233',
  contactEmail: null,
  address: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('WebsiteConfigService — tenant isolation & audit', () => {
  let service: WebsiteConfigService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new WebsiteConfigService(prisma as unknown as PrismaService, auditMock);
  });

  // ─── getMine ──────────────────────────────────────────────────────────

  it('getMine consulta por companyId del token', async () => {
    prisma.websiteConfig.findUnique.mockResolvedValue(null as never);

    await service.getMine(makeUser());

    expect(prisma.websiteConfig.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-A' } }),
    );
  });

  it('getMine devuelve null si la empresa no tiene configuración', async () => {
    prisma.websiteConfig.findUnique.mockResolvedValue(null as never);

    const result = await service.getMine(makeUser());

    expect(result).toBeNull();
  });

  // ─── upsert ───────────────────────────────────────────────────────────

  it('upsert usa companyId del token tanto en create como en update', async () => {
    prisma.websiteConfig.upsert.mockResolvedValue(makeConfig() as never);

    await service.upsert(makeUser(), { heroTitle: 'Nuevo título' });

    expect(prisma.websiteConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-A' } }),
    );
  });

  it('upsert registra audit log website_config.updated', async () => {
    prisma.websiteConfig.upsert.mockResolvedValue(makeConfig() as never);

    await service.upsert(makeUser(), { heroTitle: 'Nuevo título' });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'website_config.updated',
        targetType: 'WebsiteConfig',
        companyId: 'company-A',
      }),
    );
  });

  it('upsert solo incluye en data los campos presentes en el DTO', async () => {
    prisma.websiteConfig.upsert.mockResolvedValue(makeConfig() as never);

    await service.upsert(makeUser(), { heroTitle: 'Solo título' });

    const call = (prisma.websiteConfig.upsert as jest.Mock).mock.calls[0][0];
    expect(call.update).toHaveProperty('heroTitle', 'Solo título');
    expect(call.update).not.toHaveProperty('primaryColor');
  });

  // ─── getBySubdomain ───────────────────────────────────────────────────

  it('getBySubdomain devuelve null si la empresa está SUSPENDED', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'company-A',
      subdomain: 'mi-empresa',
      status: 'SUSPENDED',
    } as never);

    const result = await service.getBySubdomain('mi-empresa');

    expect(result).toBeNull();
    expect(prisma.websiteConfig.findUnique).not.toHaveBeenCalled();
  });

  it('getBySubdomain devuelve null si el subdominio no existe', async () => {
    prisma.company.findUnique.mockResolvedValue(null as never);

    const result = await service.getBySubdomain('inexistente');

    expect(result).toBeNull();
  });

  it('getBySubdomain devuelve config cuando la empresa está activa', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'company-A',
      subdomain: 'mi-empresa',
      status: 'ACTIVE',
    } as never);
    prisma.websiteConfig.findUnique.mockResolvedValue(makeConfig() as never);

    const result = await service.getBySubdomain('mi-empresa');

    expect(result).toMatchObject({ companyId: 'company-A' });
  });
});
