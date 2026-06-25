import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from './campaigns.service';

const seller: AuthUser = {
  id: 'seller-1',
  username: 'v',
  role: Role.VENDEDOR,
  companyId: 'company-A',
  officeId: 'office-1',
};

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CampaignsService(
      prisma as unknown as PrismaService,
      { record: jest.fn() } as unknown as AuditService,
    );
  });

  it('lanza 422 cuando la campaña tiene más de 10 destinatarios', async () => {
    const recipientLeadIds = Array.from({ length: 11 }, (_, i) => `lead-${i}`);

    await expect(
      service.create(seller, {
        name: 'Promo',
        message: 'Hola {nombre}',
        recipientLeadIds,
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('genera links wa.me y marca la campaña como ENVIADA', async () => {
    prisma.lead.findMany.mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Ana',
        phone: '+57 300 111 2233',
        companyId: 'company-A',
        sellerId: 'seller-1',
      },
    ] as never);
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (fn: unknown) => (fn as (tx: unknown) => unknown)(prisma),
    );
    prisma.campaign.create.mockResolvedValue({ id: 'camp-1' } as never);
    prisma.campaignRecipient.createMany.mockResolvedValue({ count: 1 } as never);
    prisma.campaign.findUnique.mockResolvedValue({
      id: 'camp-1',
      status: 'ENVIADA',
      recipients: [
        { waLink: 'https://wa.me/573001112233?text=Hola%20Ana' },
      ],
    } as never);

    const result = await service.create(seller, {
      name: 'Promo',
      message: 'Hola {nombre}',
      recipientLeadIds: ['lead-1'],
    });

    expect(prisma.campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ENVIADA' }),
      }),
    );
    const recipientArg = (
      prisma.campaignRecipient.createMany as unknown as jest.Mock
    ).mock.calls[0][0];
    expect(recipientArg.data[0].waLink).toContain('https://wa.me/573001112233');
    expect(result).toMatchObject({ status: 'ENVIADA' });
  });

  it('bloquea campaña cuando incluye leads fuera del alcance del vendedor', async () => {
    prisma.lead.findMany.mockResolvedValue([] as never);

    await expect(
      service.create(seller, {
        name: 'Promo',
        message: 'Hola {nombre}',
        recipientLeadIds: ['lead-ajeno'],
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('busca recipients por companyId y alcance del vendedor', async () => {
    prisma.lead.findMany.mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Ana',
        phone: '+57 300 111 2233',
        companyId: 'company-A',
        sellerId: 'seller-1',
        officeId: 'office-1',
      },
    ] as never);
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (fn: unknown) => (fn as (tx: unknown) => unknown)(prisma),
    );
    prisma.campaign.create.mockResolvedValue({ id: 'camp-1' } as never);
    prisma.campaignRecipient.createMany.mockResolvedValue({ count: 1 } as never);
    prisma.campaign.findUnique.mockResolvedValue({
      id: 'camp-1',
      status: 'ENVIADA',
      recipients: [],
    } as never);

    await service.create(seller, {
      name: 'Promo',
      message: 'Hola {nombre}',
      recipientLeadIds: ['lead-1'],
    });

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-A',
          id: { in: ['lead-1'] },
          OR: expect.arrayContaining([
            { sellerId: 'seller-1' },
            { officeId: 'office-1' },
          ]),
        }),
      }),
    );
  });
});
