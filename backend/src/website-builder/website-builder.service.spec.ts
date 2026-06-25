import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { WebsiteBuilderService } from './website-builder.service';

const admin: AuthUser = {
  id: 'admin-1',
  username: 'admin',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
};

describe('WebsiteBuilderService', () => {
  let service: WebsiteBuilderService;
  let prisma: PrismaMock;
  let audit: { record: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = { record: jest.fn() };
    service = new WebsiteBuilderService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  it('updateSection valida la data según el tipo (rechaza props desconocidas)', async () => {
    prisma.websiteSection.findFirst.mockResolvedValue({
      id: 's1',
      companyId: 'company-A',
      type: 'HERO',
    } as never);

    await expect(
      service.updateSection(admin, 's1', {
        // `htmlInjection` no está en el schema de HERO → debe lanzar 422.
        data: { htmlInjection: '<script>x</script>' } as never,
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('updateSection acepta variant válida para el tipo', async () => {
    prisma.websiteSection.findFirst.mockResolvedValue({
      id: 's1',
      companyId: 'company-A',
      type: 'HERO',
    } as never);
    prisma.websiteSection.update.mockResolvedValue({
      id: 's1',
      companyId: 'company-A',
      type: 'HERO',
      visible: true,
      order: 0,
      data: { variant: 'classic', title: 'Hola' },
    } as never);

    const result = await service.updateSection(admin, 's1', {
      data: { variant: 'classic', title: 'Hola' },
    });

    expect(result.data).toMatchObject({ variant: 'classic' });
    expect(prisma.websiteSection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          data: expect.objectContaining({ variant: 'classic' }),
        }),
      }),
    );
  });

  it('updateSection lanza 404 si la sección es de otra empresa', async () => {
    prisma.websiteSection.findFirst.mockResolvedValue(null as never);

    await expect(
      service.updateSection(admin, 's-ajena', { visible: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('publish genera publishedSnapshot solo con secciones visibles y audita', async () => {
    prisma.websitePage.findFirst.mockResolvedValue({
      id: 'p1',
      companyId: 'company-A',
      slug: 'home',
      sections: [
        { id: 's1', type: 'HERO', order: 0, visible: true, data: { title: 'Hola', variant: 'classic' } },
        { id: 's2', type: 'FAQ', order: 1, visible: false, data: { items: [] } },
        { id: 's3', type: 'CTA', order: 2, visible: true, data: { title: 'Cotiza' } },
      ],
    } as never);
    prisma.websitePage.update.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((args: any) => Promise.resolve({ id: 'p1', ...args.data })) as never,
    );

    const result = await service.publish(admin, 'p1');

    const updateCall = (prisma.websitePage.update as unknown as jest.Mock).mock
      .calls[0][0];
    const snapshot = updateCall.data.publishedSnapshot;
    expect(snapshot).toHaveLength(2);
    expect(snapshot.map((s: { type: string }) => s.type)).toEqual([
      'HERO',
      'CTA',
    ]);
    expect(snapshot[0].data).toMatchObject({ variant: 'classic' });
    expect(result).toMatchObject({ status: 'PUBLISHED' });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'page.published' }),
    );
  });

  it('deletePage bloquea borrar la página "home"', async () => {
    prisma.websitePage.findFirst.mockResolvedValue({
      id: 'p1',
      companyId: 'company-A',
      slug: 'home',
    } as never);

    await expect(service.deletePage(admin, 'p1')).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});
