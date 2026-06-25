import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from './sales.service';

const seller: AuthUser = {
  id: 'seller-1',
  username: 'vendedor',
  role: Role.VENDEDOR,
  companyId: 'company-A',
  officeId: 'office-1',
};

const dto = { leadId: 'lead-1', amount: 1500000 };

describe('SalesService', () => {
  let service: SalesService;
  let prisma: PrismaMock;
  let audit: { record: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = { record: jest.fn() };
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (fn: unknown) => (fn as (tx: unknown) => unknown)(prisma),
    );
    service = new SalesService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  it('lanza 422 si el lead ya está VENDIDO', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      companyId: 'company-A',
      officeId: 'office-1',
      sellerId: 'seller-1',
      status: 'VENDIDO',
    } as never);

    await expect(service.registerSale(seller, dto)).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('crea la venta, deja el lead en VENDIDO y audita', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      companyId: 'company-A',
      officeId: 'office-1',
      sellerId: 'seller-1',
      status: 'INTERESADO',
    } as never);
    prisma.sale.create.mockResolvedValue({ id: 'sale-1' } as never);
    prisma.lead.update.mockResolvedValue({} as never);
    prisma.leadStatusHistory.create.mockResolvedValue({} as never);

    const sale = await service.registerSale(seller, dto);

    expect(sale).toEqual({ id: 'sale-1' });
    expect(prisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'VENDIDO' }),
      }),
    );
    expect(prisma.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-A',
          officeId: 'office-1',
          sellerId: 'seller-1',
          leadId: 'lead-1',
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalled();
    expect(audit.record.mock.calls[0][0]).toEqual(
      expect.objectContaining({ action: 'sale.registered' }),
    );
  });

  it('VENDEDOR no puede vender un lead fuera de su alcance (404)', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      companyId: 'company-A',
      officeId: 'otra-oficina',
      sellerId: 'otro-vendedor',
      status: 'NUEVO',
    } as never);

    await expect(service.registerSale(seller, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('siempre busca el lead por id + companyId (bloquea cross-tenant)', async () => {
    prisma.lead.findFirst.mockResolvedValue(null as never);

    await expect(service.registerSale(seller, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.lead.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'lead-1',
          companyId: 'company-A',
        }),
      }),
    );
  });
});
