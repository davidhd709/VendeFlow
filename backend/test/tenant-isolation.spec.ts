/**
 * Test de aislamiento de tenant — el archivo más importante del proyecto.
 * Siembra dos empresas y verifica que un usuario de la Empresa B no puede
 * leer, modificar ni listar datos de la Empresa A (404, nunca 403).
 *
 * Requiere una base de datos accesible (DATABASE_URL). En CI corre contra el
 * servicio de Postgres; en local, contra el contenedor de docker-compose.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/setup-app';

async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.leadStatusHistory.deleteMany();
  await prisma.leadProductInterest.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.internalComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.monthlyGoal.deleteMany();
  await prisma.sellerAssignment.deleteMany();
  await prisma.coordinatorOffice.deleteMany();
  await prisma.websiteSection.deleteMany();
  await prisma.websitePage.deleteMany();
  await prisma.websiteConfig.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.office.deleteMany();
  await prisma.company.deleteMany();
}

describe('Tenant Isolation (integración)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let tokenVendedorB: string;
  let leadA: string;
  let leadB: string;
  let officeAId: string;
  let officeBId: string;
  let pageAId: string;
  let pageBId: string;
  let companyBId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await resetDb(prisma);

    const passwordHash = await bcrypt.hash('password123', 4);

    const companyA = await prisma.company.create({
      data: { name: 'Empresa A', slug: 'empresa-a', subdomain: 'empresa-a' },
    });
    const officeA = await prisma.office.create({
      data: { companyId: companyA.id, name: 'Sede A' },
    });
    officeAId = officeA.id;
    await prisma.user.create({
      data: {
        companyId: companyA.id,
        username: 'admin',
        name: 'Admin A',
        role: 'ADMIN',
        passwordHash,
      },
    });
    const createdLeadA = await prisma.lead.create({
      data: {
        companyId: companyA.id,
        officeId: officeA.id,
        name: 'Lead A',
        phone: '+573001112233',
      },
    });
    leadA = createdLeadA.id;
    await prisma.websiteConfig.create({
      data: {
        companyId: companyA.id,
        heroTitle: 'Empresa A',
      },
    });
    const pageA = await prisma.websitePage.create({
      data: {
        companyId: companyA.id,
        slug: 'home',
        title: 'Inicio A',
        status: 'DRAFT',
      },
    });
    pageAId = pageA.id;

    const companyB = await prisma.company.create({
      data: { name: 'Empresa B', slug: 'empresa-b', subdomain: 'empresa-b' },
    });
    companyBId = companyB.id;
    const officeB = await prisma.office.create({
      data: { companyId: companyB.id, name: 'Sede B' },
    });
    officeBId = officeB.id;
    await prisma.user.create({
      data: {
        companyId: companyB.id,
        username: 'admin',
        name: 'Admin B',
        role: 'ADMIN',
        passwordHash,
      },
    });
    const createdLeadB = await prisma.lead.create({
      data: {
        companyId: companyB.id,
        officeId: officeB.id,
        name: 'Lead B',
        phone: '+573004445566',
      },
    });
    leadB = createdLeadB.id;
    await prisma.user.create({
      data: {
        companyId: companyB.id,
        officeId: officeB.id,
        username: 'vendedor',
        name: 'Vendedor B',
        role: 'VENDEDOR',
        passwordHash,
      },
    });
    await prisma.websiteConfig.create({
      data: {
        companyId: companyB.id,
        heroTitle: 'Empresa B',
      },
    });
    const pageB = await prisma.websitePage.create({
      data: {
        companyId: companyB.id,
        slug: 'home',
        title: 'Inicio B',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedSnapshot: [
          {
            type: 'HERO',
            visible: true,
            data: { title: 'Publicado B' },
          },
        ],
      },
    });
    pageBId = pageB.id;
    await prisma.websiteSection.create({
      data: {
        companyId: companyB.id,
        pageId: pageB.id,
        type: 'HERO',
        order: 0,
        visible: true,
        data: { title: 'DRAFT-SECRET-B' },
      },
    });

    const adminARes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        subdomain: 'empresa-a',
        username: 'admin',
        password: 'password123',
      })
      .expect(201);
    tokenA = adminARes.body.accessToken;

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ subdomain: 'empresa-b', username: 'admin', password: 'password123' })
      .expect(201);
    tokenB = adminRes.body.accessToken;

    const sellerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        subdomain: 'empresa-b',
        username: 'vendedor',
        password: 'password123',
      })
      .expect(201);
    tokenVendedorB = sellerRes.body.accessToken;
  });

  afterAll(async () => {
    await resetDb(prisma);
    await app.close();
  });

  it('ADMIN de B no puede leer un lead de A (404, no 403)', () =>
    request(app.getHttpServer())
      .get(`/api/leads/${leadA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404));

  it('VENDEDOR de B no puede cambiar el estado de un lead de A (404)', () =>
    request(app.getHttpServer())
      .patch(`/api/leads/${leadA}/status`)
      .set('Authorization', `Bearer ${tokenVendedorB}`)
      .send({ status: 'VENDIDO' })
      .expect(404));

  it('ADMIN de B no ve leads de A en el listado', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    const ids = res.body.items.map((l: { id: string }) => l.id);
    expect(ids).not.toContain(leadA);
  });

  it('una ruta protegida responde 401 sin JWT', () =>
    request(app.getHttpServer()).get('/api/leads').expect(401));

  it('un ADMIN no puede acceder a endpoints de SUPERADMIN (403)', () =>
    request(app.getHttpServer())
      .get('/api/companies')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403));

  it('POST /public/leads crea el lead con companyId/officeId del servidor', async () => {
    const offices = await request(app.getHttpServer())
      .get('/api/public/empresa-b/offices')
      .expect(200);
    const officeId = offices.body[0].id as string;

    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .send({
        subdomain: 'empresa-b',
        officeId,
        name: 'Cliente Web',
        phone: '+573009998877',
      })
      .expect(201);

    const created = await prisma.lead.findUnique({ where: { id: res.body.id } });
    expect(created?.companyId).toBe(companyBId);
    expect(created?.source).toBe('web');
  });

  it('POST /public/leads rechaza companyId manipulable en payload', () =>
    request(app.getHttpServer())
      .post('/api/public/leads')
      .send({
        subdomain: 'empresa-b',
        officeId: officeBId,
        companyId: 'empresa-a-intento',
        name: 'Cliente Web',
        phone: '+573009998877',
      })
      .expect(400));

  it('POST /public/leads falla si officeId pertenece a otra empresa', () =>
    request(app.getHttpServer())
      .post('/api/public/leads')
      .send({
        subdomain: 'empresa-b',
        officeId: officeAId,
        name: 'Cliente Web',
        phone: '+573009998877',
      })
      .expect(422));

  it('POST /public/leads responde sin exponer datos internos', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/leads')
      .send({
        subdomain: 'empresa-b',
        officeId: officeBId,
        name: 'Cliente Web 2',
        phone: '+573009998811',
      })
      .expect(201);
    expect(Object.keys(res.body)).toEqual(['id']);
  });

  it('ADMIN también puede crear campañas (201, rol habilitado)', () =>
    request(app.getHttpServer())
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Campaña admin test',
        message: 'Hola {nombre}',
        recipientLeadIds: [leadB],
      })
      .expect(201));

  it('VENDEDOR no puede crear campaña usando lead de otro tenant (422)', () =>
    request(app.getHttpServer())
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${tokenVendedorB}`)
      .send({
        name: 'Campaña cross-tenant',
        message: 'Hola',
        recipientLeadIds: [leadA],
      })
      .expect(422));

  it('VENDEDOR crea campaña válida con wa.me', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${tokenVendedorB}`)
      .send({
        name: 'Campaña válida',
        message: 'Hola {nombre}',
        recipientLeadIds: [leadB],
      })
      .expect(201);

    expect(res.body).toHaveProperty('recipients');
    expect(res.body.recipients[0].waLink).toContain('https://wa.me/');
  });

  it('GET /public/website/:subdomain no requiere JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/website/empresa-b')
      .expect(200);
    expect(res.body).toHaveProperty('theme');
    expect(res.body).toHaveProperty('page');
  });

  it('GET /public/website devuelve publishedSnapshot y no filtra drafts internos', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/website/empresa-b')
      .expect(200);

    expect(res.body.page.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'HERO',
          data: expect.objectContaining({ title: 'Publicado B' }),
        }),
      ]),
    );
    expect(JSON.stringify(res.body.page)).not.toContain('DRAFT-SECRET-B');
  });

  it('si no hay publishedSnapshot, endpoint público devuelve fallback con page=null', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/website/empresa-a')
      .expect(200);
    expect(res.body.theme).toBeTruthy();
    expect(res.body.page).toBeNull();
  });

  it('ADMIN de B no puede leer página privada de Website Builder de A (404)', () =>
    request(app.getHttpServer())
      .get(`/api/website-builder/pages/${pageAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404));

  it('ADMIN de A no puede leer página privada de Website Builder de B (404)', () =>
    request(app.getHttpServer())
      .get(`/api/website-builder/pages/${pageBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404));

  it('VENDEDOR de B no puede registrar venta de lead de otro tenant (404)', () =>
    request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${tokenVendedorB}`)
      .send({ leadId: leadA, amount: 1500000 })
      .expect(404));

  it('los endpoints /public no exponen datos privados', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/public/empresa-b/products')
      .expect(200);
    expect(res.body).not.toHaveProperty('users');
    expect(res.body).not.toHaveProperty('sales');
    expect(res.body).not.toHaveProperty('leads');
  });

  // ── 4.1 — Nuevos endpoints de aislamiento ─────────────────────────────

  it('ADMIN B no puede ver tareas del lead A (404)', () =>
    request(app.getHttpServer())
      .get(`/api/leads/${leadA}/tasks`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404));

  it('VENDEDOR B no puede ver tareas del lead A (404)', () =>
    request(app.getHttpServer())
      .get(`/api/leads/${leadA}/tasks`)
      .set('Authorization', `Bearer ${tokenVendedorB}`)
      .expect(404));

  it('companyId en el body es rechazado con 400 (campo no permitido en DTO)', () =>
    request(app.getHttpServer())
      .post('/api/leads')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        companyId: 'empresa-a',
        officeId: officeBId,
        name: 'Intento inyección tenant',
        phone: '+573099988870',
      })
      .expect(400));

  it('GET /companies/my/setup-status retorna estado de la empresa del admin autenticado', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/companies/my/setup-status')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(res.body).toHaveProperty('hasOffice');
    expect(res.body).toHaveProperty('hasProduct');
    expect(res.body).toHaveProperty('hasSeller');
    expect(res.body).toHaveProperty('hasWebsiteConfig');
    // B tiene una oficina y un websiteConfig creados en beforeAll
    expect(res.body.hasOffice).toBe(true);
    expect(res.body.hasWebsiteConfig).toBe(true);
  });

  it('VENDEDOR no puede acceder a /companies/my/setup-status (403)', () =>
    request(app.getHttpServer())
      .get('/api/companies/my/setup-status')
      .set('Authorization', `Bearer ${tokenVendedorB}`)
      .expect(403));

  it('GET /audit/global requiere SUPERADMIN (403 para ADMIN)', () =>
    request(app.getHttpServer())
      .get('/api/audit/global')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403));

  it('GET /sales/export requiere autenticación (401 sin token)', () =>
    request(app.getHttpServer())
      .get('/api/sales/export')
      .expect(401));

  it('ADMIN B no puede ver comentarios del lead A (404)', () =>
    request(app.getHttpServer())
      .get(`/api/leads/${leadA}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404));

  it('ADMIN B no puede agregar follow-up al lead A (404)', () =>
    request(app.getHttpServer())
      .post(`/api/leads/${leadA}/follow-ups`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ notes: 'Intento cross-tenant', channel: 'LLAMADA' })
      .expect(404));
});
