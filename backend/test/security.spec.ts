/**
 * Tests de regresión de seguridad — Fase 4.3.
 * Verifican que:
 *   - Ningún endpoint devuelve passwordHash en la respuesta.
 *   - El intercambio cross-tenant de IDs retorna 404 (no data leak).
 *   - El refresh token es revocado al hacer logout.
 *
 * Usa limpieza dirigida por slug para convivir con otros tests de integración
 * que corren secuencialmente gracias a maxWorkers:1.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/setup-app';

const SLUG_X = 'empresa-sec-x';
const SLUG_Y = 'empresa-sec-y';

async function cleanupBySlug(prisma: PrismaService, slug: string): Promise<void> {
  const company = await prisma.company.findFirst({ where: { slug } });
  if (!company) return;
  const cId = company.id;

  const leads = await prisma.lead.findMany({ where: { companyId: cId }, select: { id: true } });
  const leadIds = leads.map((l) => l.id);
  const users = await prisma.user.findMany({ where: { companyId: cId }, select: { id: true } });
  const userIds = users.map((u) => u.id);

  await prisma.auditLog.deleteMany({ where: { companyId: cId } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leadStatusHistory.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.leadProductInterest.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.followUp.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.internalComment.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.task.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.sale.deleteMany({ where: { companyId: cId } });
  await prisma.lead.deleteMany({ where: { companyId: cId } });
  await prisma.websiteSection.deleteMany({ where: { companyId: cId } });
  await prisma.websitePage.deleteMany({ where: { companyId: cId } });
  await prisma.websiteConfig.deleteMany({ where: { companyId: cId } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.productStock.deleteMany({ where: { product: { companyId: cId } } });
  await prisma.product.deleteMany({ where: { companyId: cId } });
  await prisma.user.deleteMany({ where: { companyId: cId } });
  await prisma.office.deleteMany({ where: { companyId: cId } });
  await prisma.company.deleteMany({ where: { slug } });
}

describe('Regresión de seguridad (Fase 4.3)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Empresa X — tests de passwordHash y cross-tenant
  let tokenX: string;
  let sellerTokenX: string;
  let leadX: string;
  let leadY: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await cleanupBySlug(prisma, SLUG_X);
    await cleanupBySlug(prisma, SLUG_Y);

    const hash = await bcrypt.hash('Segura123!', 4);

    const companyX = await prisma.company.create({
      data: { name: 'Empresa Sec X', slug: SLUG_X, subdomain: SLUG_X },
    });
    const officeX = await prisma.office.create({
      data: { companyId: companyX.id, name: 'Sede X' },
    });
    await prisma.user.create({
      data: { companyId: companyX.id, username: 'admin-x', name: 'Admin X', role: 'ADMIN', passwordHash: hash },
    });
    await prisma.user.create({
      data: {
        companyId: companyX.id,
        officeId: officeX.id,
        username: 'vendedor-x',
        name: 'Vendedor X',
        role: 'VENDEDOR',
        passwordHash: hash,
      },
    });
    const lX = await prisma.lead.create({
      data: { companyId: companyX.id, officeId: officeX.id, name: 'Lead X', phone: '+573001110001' },
    });
    leadX = lX.id;

    const companyY = await prisma.company.create({
      data: { name: 'Empresa Sec Y', slug: SLUG_Y, subdomain: SLUG_Y },
    });
    const officeY = await prisma.office.create({
      data: { companyId: companyY.id, name: 'Sede Y' },
    });
    await prisma.user.create({
      data: { companyId: companyY.id, username: 'admin-y', name: 'Admin Y', role: 'ADMIN', passwordHash: hash },
    });
    const lY = await prisma.lead.create({
      data: { companyId: companyY.id, officeId: officeY.id, name: 'Lead Y', phone: '+573001110002' },
    });
    leadY = lY.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: SLUG_X, username: 'admin-x', password: 'Segura123!' })
      .expect(201);
    tokenX = loginRes.body.accessToken;

    const sellerLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: SLUG_X, username: 'vendedor-x', password: 'Segura123!' })
      .expect(201);
    sellerTokenX = sellerLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await cleanupBySlug(prisma, SLUG_X);
    await cleanupBySlug(prisma, SLUG_Y);
    await app.close();
  });

  // ── Sin passwordHash en las respuestas ───────────────────────────────

  it('GET /users no devuelve passwordHash en ningún usuario', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('password_hash');
  });

  it('GET /leads no devuelve passwordHash en la respuesta', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(200);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('GET /leads/:id no devuelve passwordHash en el detalle', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/leads/${leadX}`)
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(200);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('GET /auth/me no devuelve passwordHash', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(200);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('GET /sales no devuelve passwordHash', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sales')
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(200);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  // ── Cross-tenant ID swap devuelve 404, no datos del otro tenant ───────

  it('GET /leads con ID del tenant Y devuelve 404 (no datos cruzados)', async () => {
    await request(app.getHttpServer())
      .get(`/api/leads/${leadY}`)
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(404);
  });

  it('PATCH /leads/:id/status con ID del tenant Y devuelve 404 (vendedor de X)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/leads/${leadY}/status`)
      .set('Authorization', `Bearer ${sellerTokenX}`)
      .send({ status: 'INTERESADO' })
      .expect(404);
  });

  it('GET /leads/:id/follow-ups con ID del tenant Y devuelve 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/leads/${leadY}/follow-ups`)
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(404);
  });

  it('GET /leads/:id/comments con ID del tenant Y devuelve 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/leads/${leadY}/comments`)
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(404);
  });

  it('GET /leads/:id/tasks con ID del tenant Y devuelve 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/leads/${leadY}/tasks`)
      .set('Authorization', `Bearer ${tokenX}`)
      .expect(404);
  });

  // ── Refresh token revocado al hacer logout ───────────────────────────

  it('refresh token se invalida después de logout', async () => {
    // Login fresco para obtener el par access+refresh
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: SLUG_X, username: 'vendedor-x', password: 'Segura123!' })
      .expect(201);

    const accessToken = loginRes.body.accessToken as string;
    const cookies = (loginRes.headers['set-cookie'] ?? []) as unknown as string[];

    // Verificar que el refresh funciona antes del logout
    const refreshBefore = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(201);
    expect(refreshBefore.body).toHaveProperty('accessToken');

    // Hacer logout (invalida el refresh token)
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .expect(201);

    // El mismo cookie de refresh ya no debe funcionar
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(401);
  });

  it('usar un access token válido después de logout sigue funcionando hasta expirar', async () => {
    // El access token (JWT) es stateless — sigue siendo válido hasta los 15m.
    // Solo el refresh token queda revocado. Este test documenta ese comportamiento.
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: SLUG_X, username: 'admin-x', password: 'Segura123!' })
      .expect(201);

    const accessToken = loginRes.body.accessToken as string;
    const cookies = (loginRes.headers['set-cookie'] ?? []) as unknown as string[];

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookies)
      .expect(201);

    // El access token (JWT firmado con secreto) sigue siendo válido localmente
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('id');
  });
});
