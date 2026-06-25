/**
 * Tests de flujo E2E — Fase 4.2.
 * Verifican el ciclo completo: visitante → lead → asignación → cambio de estado → venta
 * y que el historial, la atomicidad y el campo notes funcionen correctamente.
 *
 * Usa limpieza dirigida por slug (no resetDb global) para convivir con otros
 * archivos de integración que corren secuencialmente gracias a maxWorkers:1.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/setup-app';

const SLUG = 'empresa-flow';

async function cleanupCompany(prisma: PrismaService): Promise<void> {
  const company = await prisma.company.findFirst({ where: { slug: SLUG } });
  if (!company) return;
  const cId = company.id;

  const leads = await prisma.lead.findMany({ where: { companyId: cId }, select: { id: true } });
  const leadIds = leads.map((l) => l.id);
  const users = await prisma.user.findMany({ where: { companyId: cId }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const offices = await prisma.office.findMany({ where: { companyId: cId }, select: { id: true } });
  const officeIds = offices.map((o) => o.id);

  await prisma.auditLog.deleteMany({ where: { companyId: cId } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.campaignRecipient.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.campaign.deleteMany({ where: { companyId: cId } });
  await prisma.messageTemplate.deleteMany({ where: { companyId: cId } });
  await prisma.leadStatusHistory.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.leadProductInterest.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.followUp.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.internalComment.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.task.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.sale.deleteMany({ where: { companyId: cId } });
  await prisma.lead.deleteMany({ where: { companyId: cId } });
  await prisma.monthlyGoal.deleteMany({ where: { companyId: cId } });
  await prisma.sellerAssignment.deleteMany({ where: { companyId: cId } });
  await prisma.coordinatorOffice.deleteMany({ where: { companyId: cId } });
  await prisma.websiteSection.deleteMany({ where: { companyId: cId } });
  await prisma.websitePage.deleteMany({ where: { companyId: cId } });
  await prisma.websiteConfig.deleteMany({ where: { companyId: cId } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.productStock.deleteMany({ where: { product: { companyId: cId } } });
  await prisma.product.deleteMany({ where: { companyId: cId } });
  await prisma.user.deleteMany({ where: { companyId: cId } });
  await prisma.office.deleteMany({ where: { companyId: cId } });
  await prisma.company.deleteMany({ where: { slug: SLUG } });
}

describe('Flujo E2E — visitante → lead → venta (Fase 4.2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let sellerToken: string;
  let officeId: string;
  let sellerId: string;
  let leadId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await cleanupCompany(prisma);

    const hash = await bcrypt.hash('Test1234!', 4);

    const company = await prisma.company.create({
      data: { name: 'Empresa Flow', slug: SLUG, subdomain: SLUG },
    });
    const office = await prisma.office.create({
      data: { companyId: company.id, name: 'Sede Principal' },
    });
    officeId = office.id;

    await prisma.user.create({
      data: { companyId: company.id, username: 'admin-flow', name: 'Admin Flow', role: 'ADMIN', passwordHash: hash },
    });
    const seller = await prisma.user.create({
      data: {
        companyId: company.id,
        officeId: office.id,
        username: 'vendedor-flow',
        name: 'Vendedor Flow',
        role: 'VENDEDOR',
        passwordHash: hash,
      },
    });
    sellerId = seller.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: SLUG, username: 'admin-flow', password: 'Test1234!' })
      .expect(201);
    adminToken = adminRes.body.accessToken;

    const sellerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: SLUG, username: 'vendedor-flow', password: 'Test1234!' })
      .expect(201);
    sellerToken = sellerRes.body.accessToken;
  });

  afterAll(async () => {
    await cleanupCompany(prisma);
    await app.close();
  });

  // ── Paso 1: formulario público crea el lead ──────────────────────────

  it('POST /public/leads crea un lead con source=web y devuelve solo el id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .send({ subdomain: SLUG, officeId, name: 'Cliente Nuevo', phone: '+573001119999' })
      .expect(201);

    expect(Object.keys(res.body)).toEqual(['id']);
    leadId = res.body.id as string;

    const inDb = await prisma.lead.findUnique({ where: { id: leadId } });
    expect(inDb?.source).toBe('web');
    expect(inDb?.status).toBe('NUEVO');
  });

  // ── Paso 2: admin ve el lead en el listado ───────────────────────────

  it('GET /leads incluye el lead recién creado', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const ids = (res.body.items as Array<{ id: string }>).map((l) => l.id);
    expect(ids).toContain(leadId);
  });

  // ── Paso 3: admin asigna un vendedor ────────────────────────────────

  it('PATCH /leads/:id/seller asigna el vendedor al lead', async () => {
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadId}/seller`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sellerId })
      .expect(200);

    const inDb = await prisma.lead.findUnique({ where: { id: leadId } });
    expect(inDb?.sellerId).toBe(sellerId);
  });

  // ── Paso 4: vendedor ve el lead asignado ────────────────────────────

  it('vendedor asignado puede ver el lead por id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(res.body.name).toBe('Cliente Nuevo');
    expect(res.body.status).toBe('NUEVO');
  });

  // ── Paso 5: vendedor avanza el estado ───────────────────────────────

  it('PATCH /leads/:id/status cambia el estado a INTERESADO', async () => {
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'INTERESADO' })
      .expect(200);

    const inDb = await prisma.lead.findUnique({ where: { id: leadId } });
    expect(inDb?.status).toBe('INTERESADO');
  });

  // ── Paso 6: el cambio queda registrado en el historial ───────────────

  it('GET /leads/:id/status-history contiene el cambio a INTERESADO', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}/status-history`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const records = res.body as Array<{ toState: string }>;
    expect(records.some((h) => h.toState === 'INTERESADO')).toBe(true);
  });

  // ── Paso 7: vendedor registra la venta con notes ─────────────────────

  it('POST /sales crea la venta con notes y deja el lead en VENDIDO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ leadId, amount: 1_500_000, notes: 'iPhone 13 negro, pago en efectivo' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.notes).toBe('iPhone 13 negro, pago en efectivo');
    expect(Number(res.body.amount)).toBe(1_500_000);

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    expect(lead?.status).toBe('VENDIDO');
  });

  // ── Paso 8: GET lead confirma estado VENDIDO ─────────────────────────

  it('GET /leads/:id después de la venta muestra status VENDIDO', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBe('VENDIDO');
  });

  // ── Paso 9: doble venta sobre el mismo lead es rechazada ─────────────

  it('segunda venta sobre el mismo lead devuelve 422 (lead ya VENDIDO)', async () => {
    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ leadId, amount: 2_000_000 })
      .expect(422);
  });

  // ── Historial registra VENDIDO también ───────────────────────────────

  it('GET /leads/:id/status-history incluye la transición a VENDIDO', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}/status-history`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const records = res.body as Array<{ toState: string }>;
    expect(records.some((h) => h.toState === 'VENDIDO')).toBe(true);
  });

  // ── Export CSV incluye la venta con notes ────────────────────────────

  it('GET /sales/export devuelve CSV con la columna Notas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Notas');
    expect(res.text).toContain('iPhone 13 negro');
  });
});
