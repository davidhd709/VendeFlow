import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

const auditMock  = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
const notifsMock = { notify: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService;

const filters = { page: 1, limit: 20, skip: 0, take: 20 } as never;

const make = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'u',
  role: Role.ADMIN,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(
      (arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : (arg as () => unknown)(),
    );
    service = new TasksService(prisma as unknown as PrismaService, auditMock, notifsMock);
  });

  it('el VENDEDOR solo ve tareas asignadas a él', async () => {
    prisma.task.findMany.mockResolvedValue([] as never);
    prisma.task.count.mockResolvedValue(0 as never);

    await service.findAll(make({ role: Role.VENDEDOR, id: 'seller-1' }), filters);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-A',
          assignedToId: 'seller-1',
        }),
      }),
    );
  });

  it('el COORDINADOR no puede asignar tareas a un vendedor que no supervisa', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'seller-x',
      companyId: 'company-A',
    } as never);
    prisma.sellerAssignment.findFirst.mockResolvedValue(null as never);

    await expect(
      service.create(make({ role: Role.COORDINADOR, id: 'coord-1' }), {
        title: 'Llamar',
        assignedToId: 'seller-x',
      }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});
