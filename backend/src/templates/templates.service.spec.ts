import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from './templates.service';

const auditMock = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

const makeTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: 'tpl-1',
  companyId: 'company-A',
  createdById: 'user-1',
  name: 'Promo Mayo',
  body: 'Hola {nombre}',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('TemplatesService — tenant isolation & audit', () => {
  let service: TemplatesService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new TemplatesService(prisma as unknown as PrismaService, auditMock);
  });

  // ─── findAll ──────────────────────────────────────────────────────────

  it('findAll incluye companyId del token en el where', async () => {
    prisma.messageTemplate.findMany.mockResolvedValue([] as never);

    await service.findAll(makeUser());

    expect(prisma.messageTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('findAll filtra por isActive:true para roles distintos de ADMIN', async () => {
    prisma.messageTemplate.findMany.mockResolvedValue([] as never);

    await service.findAll(makeUser({ role: Role.VENDEDOR }));

    expect(prisma.messageTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
  });

  it('ADMIN ve todas las plantillas (sin filtro isActive)', async () => {
    prisma.messageTemplate.findMany.mockResolvedValue([] as never);

    await service.findAll(makeUser({ role: Role.ADMIN }));

    const call = (prisma.messageTemplate.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).not.toHaveProperty('isActive');
  });

  // ─── create ───────────────────────────────────────────────────────────

  it('create inyecta companyId del token', async () => {
    prisma.messageTemplate.create.mockResolvedValue(makeTemplate() as never);

    await service.create(makeUser(), { name: 'Test', body: 'Hola' });

    expect(prisma.messageTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('create registra audit log template.created', async () => {
    prisma.messageTemplate.create.mockResolvedValue(makeTemplate() as never);

    await service.create(makeUser(), { name: 'Test', body: 'Hola' });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'template.created', targetType: 'MessageTemplate' }),
    );
  });

  // ─── update ───────────────────────────────────────────────────────────

  it('update lanza 404 si la plantilla no es de la empresa', async () => {
    prisma.messageTemplate.findFirst.mockResolvedValue(null as never);

    await expect(
      service.update(makeUser(), 'tpl-otro-tenant', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('update incluye companyId del token en el where de búsqueda', async () => {
    prisma.messageTemplate.findFirst.mockResolvedValue(makeTemplate() as never);
    prisma.messageTemplate.update.mockResolvedValue(makeTemplate({ name: 'Nueva' }) as never);

    await service.update(makeUser(), 'tpl-1', { name: 'Nueva' });

    expect(prisma.messageTemplate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'tpl-1', companyId: 'company-A' }),
      }),
    );
  });

  it('update registra audit log template.updated', async () => {
    prisma.messageTemplate.findFirst.mockResolvedValue(makeTemplate() as never);
    prisma.messageTemplate.update.mockResolvedValue(makeTemplate({ name: 'Nueva' }) as never);

    await service.update(makeUser(), 'tpl-1', { name: 'Nueva' });

    expect(auditMock.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'template.updated', targetType: 'MessageTemplate' }),
    );
  });
});
