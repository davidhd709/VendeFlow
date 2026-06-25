import { Role } from '@prisma/client';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'vendedor',
  role: Role.VENDEDOR,
  companyId: 'company-A',
  officeId: null,
  ...overrides,
});

const makeLead = (id: string, lastContactedAt: Date | null = null) => ({
  id,
  name: `Cliente ${id}`,
  lastContactedAt,
  seller: { name: 'Vendedor Test' },
});

const makeTask = (id: string, daysAgo = 3) => ({
  id,
  title: `Tarea ${id}`,
  dueDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
});

describe('AlertsService — tenant isolation & RBAC', () => {
  let service: AlertsService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.lead.findMany.mockResolvedValue([] as never);
    prisma.task.findMany.mockResolvedValue([] as never);
    service = new AlertsService(prisma as unknown as PrismaService);
  });

  // ─── tenant isolation ─────────────────────────────────────────────────

  it('siempre filtra leads por companyId del token', async () => {
    await service.getAlerts(makeUser({ role: Role.ADMIN }));

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('siempre filtra tareas por companyId del token', async () => {
    await service.getAlerts(makeUser({ role: Role.ADMIN }));

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-A' }),
      }),
    );
  });

  it('lanza error si el usuario no tiene companyId (SUPERADMIN no puede llamar este endpoint)', async () => {
    await expect(
      service.getAlerts(makeUser({ role: Role.SUPERADMIN, companyId: null })),
    ).rejects.toThrow();
  });

  // ─── RBAC — scoping por rol ───────────────────────────────────────────

  it('VENDEDOR filtra leads por sellerId propio', async () => {
    await service.getAlerts(makeUser({ id: 'vendedor-1', role: Role.VENDEDOR }));

    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sellerId: 'vendedor-1', companyId: 'company-A' }),
      }),
    );
  });

  it('VENDEDOR filtra tareas por assignedToId propio', async () => {
    await service.getAlerts(makeUser({ id: 'vendedor-1', role: Role.VENDEDOR }));

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assignedToId: 'vendedor-1', companyId: 'company-A' }),
      }),
    );
  });

  it('ADMIN no filtra por sellerId (ve todos los leads de la empresa)', async () => {
    await service.getAlerts(makeUser({ role: Role.ADMIN }));

    const call = (prisma.lead.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).not.toHaveProperty('sellerId');
  });

  it('ADMIN no filtra tareas por assignedToId', async () => {
    await service.getAlerts(makeUser({ role: Role.ADMIN }));

    const call = (prisma.task.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).not.toHaveProperty('assignedToId');
  });

  // ─── estructura de alertas ────────────────────────────────────────────

  it('genera alerta STALE_LEAD para lead sin lastContactedAt', async () => {
    prisma.lead.findMany.mockResolvedValue([makeLead('lead-1', null)] as never);

    const alerts = await service.getAlerts(makeUser({ role: Role.ADMIN }));

    const stale = alerts.find((a) => a.type === 'STALE_LEAD');
    expect(stale).toBeDefined();
    expect(stale!.leadId).toBe('lead-1');
    expect(stale!.description).toContain('nunca ha sido contactado');
  });

  it('genera alerta OVERDUE_TASK para tarea vencida', async () => {
    prisma.task.findMany.mockResolvedValue([makeTask('task-1', 5)] as never);

    const alerts = await service.getAlerts(makeUser({ role: Role.ADMIN }));

    const overdue = alerts.find((a) => a.type === 'OVERDUE_TASK');
    expect(overdue).toBeDefined();
    expect(overdue!.taskId).toBe('task-1');
    expect(overdue!.description).toContain('5 días');
  });

  it('devuelve arreglo vacío cuando no hay leads ni tareas problemáticas', async () => {
    const alerts = await service.getAlerts(makeUser({ role: Role.ADMIN }));

    expect(alerts).toHaveLength(0);
  });
});
