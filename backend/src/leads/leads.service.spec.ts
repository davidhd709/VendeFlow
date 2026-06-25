import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from './leads.service';

const notifsMock = { notify: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'tester',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: 'office-1',
  ...overrides,
});

const filters = { page: 1, limit: 20, skip: 0, take: 20 } as never;

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: PrismaMock;
  let audit: { record: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = { record: jest.fn() };
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (arg: unknown) =>
        Array.isArray(arg)
          ? Promise.all(arg)
          : (arg as (tx: unknown) => unknown)(prisma),
    );
    service = new LeadsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      notifsMock,
    );
  });

  describe('aislamiento de tenant', () => {
    it('filtra siempre por companyId del usuario', async () => {
      prisma.lead.findMany.mockResolvedValue([]);
      prisma.lead.count.mockResolvedValue(0);

      await service.findAll(makeUser({ role: Role.ADMIN }), filters);

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'company-A' }),
        }),
      );
    });

    it('VENDEDOR filtra además por sellerId u officeId', async () => {
      prisma.lead.findMany.mockResolvedValue([]);
      prisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        makeUser({ role: Role.VENDEDOR, id: 'seller-1', officeId: 'office-1' }),
        filters,
      );

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-A',
            OR: expect.arrayContaining([
              { sellerId: 'seller-1' },
              { officeId: 'office-1' },
            ]),
          }),
        }),
      );
    });

    it('findOne lanza 404 si el lead no está en el alcance', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      await expect(service.findOne(makeUser(), 'lead-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('COORDINADOR filtra por vendedores asignados', async () => {
      prisma.sellerAssignment.findMany.mockResolvedValue([
        { sellerId: 'seller-1' },
        { sellerId: 'seller-2' },
      ] as never);
      prisma.lead.findMany.mockResolvedValue([]);
      prisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        makeUser({ role: Role.COORDINADOR, id: 'coord-1' }),
        filters,
      );

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-A',
            sellerId: { in: ['seller-1', 'seller-2'] },
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('crea lead privado usando companyId del usuario autenticado', async () => {
      prisma.office.findFirst.mockResolvedValue({
        id: 'office-1',
        companyId: 'company-A',
      } as never);
      prisma.lead.create.mockResolvedValue({
        id: 'lead-1',
        companyId: 'company-A',
      } as never);
      prisma.product.findMany.mockResolvedValue([] as never);

      await service.create(makeUser({ companyId: 'company-A' }), {
        officeId: 'office-1',
        name: 'Cliente',
        phone: '+573001112233',
      });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'company-A',
            officeId: 'office-1',
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('registra historial y audita el cambio de estado', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        companyId: 'company-A',
        status: 'NUEVO',
        officeId: 'office-1',
        sellerId: 'user-1',
      } as never);
      prisma.lead.update.mockResolvedValue({
        id: 'lead-1',
        status: 'CONTACTADO',
      } as never);
      prisma.leadStatusHistory.create.mockResolvedValue({} as never);

      await service.updateStatus(makeUser(), 'lead-1', 'CONTACTADO');

      expect(prisma.leadStatusHistory.create).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalled();
      expect(audit.record.mock.calls[0][0]).toEqual(
        expect.objectContaining({ action: 'lead.status_changed' }),
      );
    });
  });
});
