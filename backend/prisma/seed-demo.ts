/**
 * seed-demo.ts — Datos de prueba para 3 empresas
 *
 * Crea (o sobrescribe) tres tiendas de celulares completas con:
 * oficinas, asesores, coordinadores, productos, leads, ventas, tareas y seguimientos.
 *
 * Uso:
 *   pnpm --filter @salesflow/backend exec ts-node prisma/seed-demo.ts
 *
 * Es idempotente: borra las 3 empresas demo antes de recrearlas.
 */
import { PrismaClient, LeadStatus, ProductCondition, FollowUpChannel, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min: number, max: number): number {
  // Determinista: usa un hash simple del rango para evitar Math.random()
  return min + ((min * 7 + max * 13) % (max - min + 1));
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// Limpia una empresa por slug antes de recrearla
async function dropCompany(slug: string): Promise<void> {
  const company = await prisma.company.findFirst({ where: { slug } });
  if (!company) return;
  const cId = company.id;

  const leads = await prisma.lead.findMany({ where: { companyId: cId }, select: { id: true } });
  const leadIds = leads.map((l) => l.id);
  const users = await prisma.user.findMany({ where: { companyId: cId }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const offices = await prisma.office.findMany({ where: { companyId: cId }, select: { id: true } });
  const officeIds = offices.map((o) => o.id);

  await prisma.auditLog.deleteMany({ where: { companyId: cId } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
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
  await prisma.productStock.deleteMany({ where: { product: { companyId: cId } } });
  await prisma.product.deleteMany({ where: { companyId: cId } });
  await prisma.user.deleteMany({ where: { companyId: cId } });
  await prisma.office.deleteMany({ where: { companyId: cId } });
  await prisma.company.deleteMany({ where: { slug } });
}

// ── Definición de las 3 empresas ─────────────────────────────────────────────

interface SeedCompany {
  name: string;
  slug: string;
  subdomain: string;
  city: string;
  primaryColor: string;
  contactPhone: string;
}

const COMPANIES: SeedCompany[] = [
  {
    name: 'CelTech Medellín',
    slug: 'celtech',
    subdomain: 'celtech',
    city: 'Medellín',
    primaryColor: '#2563eb',
    contactPhone: '+5746040001',
  },
  {
    name: 'PhoneZone Bogotá',
    slug: 'phonezone',
    subdomain: 'phonezone',
    city: 'Bogotá',
    primaryColor: '#7c3aed',
    contactPhone: '+5713200002',
  },
  {
    name: 'MovilTop Cali',
    slug: 'moviltop',
    subdomain: 'moviltop',
    city: 'Cali',
    primaryColor: '#059669',
    contactPhone: '+5723000003',
  },
];

// ── Catálogo de productos (compartido, cada empresa tiene su propio registro) ─

interface ProductDef {
  name: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  condition: ProductCondition;
  warranty: string;
  price: number;
  description: string;
}

const CATALOG: ProductDef[] = [
  {
    name: 'iPhone 15 Pro Max 256GB Titanio',
    brand: 'Apple', model: 'iPhone 15 Pro Max', ram: '8GB', storage: '256GB',
    color: 'Titanio Natural', condition: 'NUEVO', warranty: '12 meses garantía Apple',
    price: 6_500_000,
    description: 'El iPhone más potente con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR de 6.7".',
  },
  {
    name: 'iPhone 14 128GB Azul',
    brand: 'Apple', model: 'iPhone 14', ram: '6GB', storage: '128GB',
    color: 'Azul', condition: 'NUEVO', warranty: '12 meses garantía Apple',
    price: 3_900_000,
    description: 'iPhone 14 con chip A15 Bionic, Modo de Acción y pantalla Always-On.',
  },
  {
    name: 'Samsung Galaxy S24 Ultra 256GB Negro',
    brand: 'Samsung', model: 'Galaxy S24 Ultra', ram: '12GB', storage: '256GB',
    color: 'Titanio Negro', condition: 'NUEVO', warranty: '12 meses Samsung',
    price: 5_800_000,
    description: 'El Galaxy más potente con S Pen integrado, cámara de 200MP y pantalla Dynamic AMOLED de 6.8".',
  },
  {
    name: 'Samsung Galaxy A54 5G 128GB Violeta',
    brand: 'Samsung', model: 'Galaxy A54', ram: '8GB', storage: '128GB',
    color: 'Violeta', condition: 'NUEVO', warranty: '12 meses Samsung',
    price: 1_750_000,
    description: 'Excelente relación calidad-precio, pantalla AMOLED de 6.4", cámara de 50MP y batería de 5000mAh.',
  },
  {
    name: 'Motorola Edge 40 256GB Negro',
    brand: 'Motorola', model: 'Edge 40', ram: '8GB', storage: '256GB',
    color: 'Eclipse Negro', condition: 'NUEVO', warranty: '12 meses Motorola',
    price: 1_490_000,
    description: 'Carga turbo de 68W, pantalla pOLED de 6.55" a 144Hz y protección IP68.',
  },
  {
    name: 'Xiaomi Redmi Note 12 128GB Azul',
    brand: 'Xiaomi', model: 'Redmi Note 12', ram: '6GB', storage: '128GB',
    color: 'Ice Blue', condition: 'NUEVO', warranty: '6 meses',
    price: 850_000,
    description: 'Pantalla AMOLED de 6.67", cámara de 50MP y batería de 5000mAh con carga de 33W.',
  },
  {
    name: 'iPhone 13 128GB Reacondicionado',
    brand: 'Apple', model: 'iPhone 13', ram: '4GB', storage: '128GB',
    color: 'Medianoche', condition: 'REACONDICIONADO', warranty: '6 meses garantía tienda',
    price: 2_100_000,
    description: 'iPhone 13 reacondicionado en excelente estado. Chip A15 Bionic y pantalla Super Retina XDR de 6.1".',
  },
  {
    name: 'Google Pixel 8 256GB Obsidiana',
    brand: 'Google', model: 'Pixel 8', ram: '8GB', storage: '256GB',
    color: 'Obsidiana', condition: 'NUEVO', warranty: '12 meses Google',
    price: 3_200_000,
    description: 'El mejor Android puro con chip Tensor G3, cámara computacional y 7 años de actualizaciones.',
  },
];

// ── Nombres de clientes colombianos para leads ────────────────────────────────

const CLIENTES = [
  { name: 'Carlos Andrés Morales', phone: '+573001110001', email: 'c.morales@gmail.com' },
  { name: 'Valentina Ospina', phone: '+573002220002', email: 'v.ospina@hotmail.com' },
  { name: 'Sebastián Ríos', phone: '+573003330003', email: null },
  { name: 'Daniela Cárdenas', phone: '+573004440004', email: 'd.cardenas@gmail.com' },
  { name: 'Miguel Ángel Torres', phone: '+573005550005', email: null },
  { name: 'Laura Fernández', phone: '+573006660006', email: 'l.fernandez@yahoo.com' },
  { name: 'Andrés Felipe Gómez', phone: '+573007770007', email: null },
  { name: 'María Camila Pérez', phone: '+573008880008', email: 'm.perez@gmail.com' },
  { name: 'Juan Pablo Herrera', phone: '+573009990009', email: null },
  { name: 'Paula Andrea Vargas', phone: '+573010100010', email: 'paula.v@gmail.com' },
  { name: 'Diego Alejandro Salcedo', phone: '+573011110011', email: null },
  { name: 'Natalia Jiménez', phone: '+573012120012', email: 'n.jimenez@hotmail.com' },
  { name: 'Camilo Suárez', phone: '+573013130013', email: null },
  { name: 'Luisa María Castro', phone: '+573014140014', email: 'l.castro@gmail.com' },
  { name: 'Felipe Arango', phone: '+573015150015', email: null },
  { name: 'Sara Quintero', phone: '+573016160016', email: 's.quintero@gmail.com' },
  { name: 'Esteban Muñoz', phone: '+573017170017', email: null },
  { name: 'Isabella Restrepo', phone: '+573018180018', email: 'i.restrepo@hotmail.com' },
  { name: 'Nicolás Bermúdez', phone: '+573019190019', email: null },
  { name: 'Alejandra Lozano', phone: '+573020200020', email: 'a.lozano@gmail.com' },
];

// Fuentes de leads
const SOURCES = ['web', 'whatsapp', 'referido', 'redes', 'presencial', 'llamada'];

// ── Función principal por empresa ─────────────────────────────────────────────

async function seedCompany(def: SeedCompany, companyIndex: number): Promise<void> {
  console.log(`\n▸ Creando ${def.name}...`);

  const hash = await bcrypt.hash('demo1234', 10);

  // ── Empresa ────────────────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: def.name,
      slug: def.slug,
      subdomain: def.subdomain,
      status: companyIndex === 2 ? 'TRIAL' : 'ACTIVE',
    },
  });

  // ── Sitio web básico ────────────────────────────────────────────────────────
  await prisma.websiteConfig.create({
    data: {
      companyId: company.id,
      heroTitle: `Los mejores celulares en ${def.city}`,
      heroSubtitle: 'Equipos nuevos, reacondicionados y usados con garantía. Financiación disponible.',
      primaryColor: def.primaryColor,
      logoUrl: null,
      contactPhone: def.contactPhone,
      contactEmail: `ventas@${def.slug}.co`,
      address: `Cra 50 #45-20, ${def.city}`,
    },
  });

  // ── Oficinas ────────────────────────────────────────────────────────────────
  const officeNames = [
    `${def.city} Centro`,
    `${def.city} Norte`,
    `${def.city} Sur`,
  ];
  const offices = await Promise.all(
    officeNames.map((name, i) =>
      prisma.office.create({
        data: {
          companyId: company.id,
          name,
          address: `Calle ${10 + i * 20} #${5 + i * 5}-${i * 10 + 15}, ${def.city}`,
          city: def.city,
          phone: `+57${def.contactPhone.slice(3).replace(/\d$/, String(i + 1))}`,
        },
      }),
    ),
  );

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      username: `admin`,
      name: `Administrador ${def.city}`,
      role: 'ADMIN',
      passwordHash: hash,
      email: `admin@${def.slug}.co`,
    },
  });
  console.log(`  ✓ Admin: admin / demo1234`);

  // ── Coordinadores ──────────────────────────────────────────────────────────
  const coordNames = [
    { username: 'coord1', name: 'Patricia Londoño' },
    { username: 'coord2', name: 'Roberto Patiño' },
  ];
  const coordinators = await Promise.all(
    coordNames.map((c, i) =>
      prisma.user.create({
        data: {
          companyId: company.id,
          officeId: offices[i].id,
          username: c.username,
          name: c.name,
          role: 'COORDINADOR',
          passwordHash: hash,
        },
      }),
    ),
  );

  // Coordinadores supervisan sus oficinas
  await Promise.all(
    coordinators.map((coord, i) =>
      prisma.coordinatorOffice.create({
        data: {
          companyId: company.id,
          coordinatorId: coord.id,
          officeId: offices[i].id,
        },
      }),
    ),
  );
  console.log(`  ✓ Coordinadores: coord1, coord2 / demo1234`);

  // ── Vendedores (3 por coordinador = 6 total) ───────────────────────────────
  const sellerDefs = [
    { username: 'vendedor1', name: 'Jhon Espinosa', coordIdx: 0, officeIdx: 0 },
    { username: 'vendedor2', name: 'Marcela Giraldo', coordIdx: 0, officeIdx: 0 },
    { username: 'vendedor3', name: 'Camilo Vásquez', coordIdx: 0, officeIdx: 1 },
    { username: 'vendedor4', name: 'Juliana Ríos', coordIdx: 1, officeIdx: 1 },
    { username: 'vendedor5', name: 'Rodrigo Peña', coordIdx: 1, officeIdx: 2 },
    { username: 'vendedor6', name: 'Diana Castillo', coordIdx: 1, officeIdx: 2 },
  ];

  const sellers = await Promise.all(
    sellerDefs.map((s) =>
      prisma.user.create({
        data: {
          companyId: company.id,
          officeId: offices[s.officeIdx].id,
          username: s.username,
          name: s.name,
          role: 'VENDEDOR',
          passwordHash: hash,
        },
      }),
    ),
  );

  // Asignaciones coordinador → vendedor
  await Promise.all(
    sellerDefs.map((s, i) =>
      prisma.sellerAssignment.create({
        data: {
          companyId: company.id,
          coordinatorId: coordinators[s.coordIdx].id,
          sellerId: sellers[i].id,
        },
      }),
    ),
  );
  console.log(`  ✓ Vendedores: vendedor1–vendedor6 / demo1234`);

  // ── Productos ──────────────────────────────────────────────────────────────
  const products = await Promise.all(
    CATALOG.map((p, i) =>
      prisma.product.create({
        data: {
          companyId: company.id,
          name: p.name,
          slug: `${p.brand.toLowerCase()}-${p.model.toLowerCase().replace(/\s+/g, '-')}-${def.slug}-${i}`,
          description: p.description,
          brand: p.brand,
          model: p.model,
          ram: p.ram,
          storage: p.storage,
          color: p.color,
          condition: p.condition,
          warranty: p.warranty,
          price: p.price,
          isActive: true,
        },
      }),
    ),
  );

  // Stock por oficina (cantidad variable)
  const stockQty = [5, 8, 3, 10, 7, 12, 4, 6];
  await Promise.all(
    products.flatMap((product, pi) =>
      offices.map((office, oi) =>
        prisma.productStock.create({
          data: {
            companyId: company.id,
            productId: product.id,
            officeId: office.id,
            quantity: stockQty[(pi + oi * 3) % stockQty.length],
          },
        }),
      ),
    ),
  );
  console.log(`  ✓ ${products.length} productos con stock en ${offices.length} oficinas`);

  // ── Metas mensuales ────────────────────────────────────────────────────────
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12

  await Promise.all([
    // Metas por oficina
    ...offices.map((office, i) =>
      prisma.monthlyGoal.create({
        data: {
          companyId: company.id,
          officeId: office.id,
          year: currentYear,
          month: currentMonthNum,
          targetSales: 15 + i * 5,
          targetAmount: (25_000_000 + i * 5_000_000).toString(),
        },
      }),
    ),
    // Metas por vendedor
    ...sellers.map((seller, i) =>
      prisma.monthlyGoal.create({
        data: {
          companyId: company.id,
          userId: seller.id,
          year: currentYear,
          month: currentMonthNum,
          targetSales: 5 + (i % 3),
          targetAmount: (8_000_000 + (i % 3) * 2_000_000).toString(),
        },
      }),
    ),
  ]);

  // ── Leads ──────────────────────────────────────────────────────────────────
  // 20 leads por empresa, con distintos estados, fuentes y fechas
  const leadStatuses: LeadStatus[] = [
    'NUEVO', 'NUEVO', 'CONTACTADO', 'CONTACTADO', 'EN_SEGUIMIENTO',
    'EN_SEGUIMIENTO', 'INTERESADO', 'INTERESADO', 'INTERESADO',
    'VENDIDO', 'VENDIDO', 'VENDIDO', 'VENDIDO', 'VENDIDO',
    'PERDIDO', 'PERDIDO', 'SIN_RESPUESTA', 'SIN_RESPUESTA',
    'NUEVO', 'CONTACTADO',
  ];

  const createdLeads = await Promise.all(
    CLIENTES.map((cliente, i) => {
      const status = leadStatuses[i % leadStatuses.length];
      const sellerIdx = i % sellers.length;
      const officeIdx = i % offices.length;
      const daysBack = i * 3 + companyIndex * 2;

      return prisma.lead.create({
        data: {
          companyId: company.id,
          officeId: offices[officeIdx].id,
          // Los primeros 3 leads no tienen vendedor asignado (NUEVO sin asignar)
          sellerId: i < 3 ? null : sellers[sellerIdx].id,
          name: cliente.name,
          phone: `${cliente.phone.slice(0, -4)}${String(companyIndex * 1000 + i).padStart(4, '0')}`,
          email: cliente.email,
          status,
          source: pick(SOURCES, i + companyIndex * 7),
          notes: i % 3 === 0 ? 'Cliente interesado en financiación' : null,
          createdAt: daysAgo(daysBack),
          lastContactedAt: i >= 3 ? daysAgo(Math.max(0, daysBack - 1)) : null,
        },
      });
    }),
  );
  console.log(`  ✓ ${createdLeads.length} leads`);

  // ── Interés en productos ───────────────────────────────────────────────────
  await Promise.all(
    createdLeads.flatMap((lead, i) => {
      const main = products[i % products.length];
      const secondary = products[(i + 2) % products.length];
      return [
        prisma.leadProductInterest.create({
          data: { companyId: company.id, leadId: lead.id, productId: main.id },
        }),
        // Algunos leads muestran interés en un segundo producto
        ...(i % 3 === 0
          ? [
              prisma.leadProductInterest.create({
                data: { companyId: company.id, leadId: lead.id, productId: secondary.id },
              }),
            ]
          : []),
      ];
    }),
  );

  // ── Historial de estados ───────────────────────────────────────────────────
  // Para leads que no son NUEVO: registrar las transiciones
  const transitionMap: Record<LeadStatus, LeadStatus[]> = {
    NUEVO: [],
    CONTACTADO: ['NUEVO'],
    EN_SEGUIMIENTO: ['NUEVO', 'CONTACTADO'],
    INTERESADO: ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO'],
    VENDIDO: ['NUEVO', 'CONTACTADO', 'INTERESADO'],
    PERDIDO: ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO'],
    SIN_RESPUESTA: ['NUEVO', 'CONTACTADO'],
  };

  for (const lead of createdLeads) {
    const transitions = transitionMap[lead.status as LeadStatus];
    if (!transitions || transitions.length === 0) continue;

    const allStates: (LeadStatus | null)[] = [null, ...transitions, lead.status as LeadStatus];
    for (let t = 1; t < allStates.length; t++) {
      await prisma.leadStatusHistory.create({
        data: {
          companyId: company.id,
          leadId: lead.id,
          fromState: allStates[t - 1],
          toState: allStates[t]!,
          changedBy: lead.sellerId ?? admin.id,
          createdAt: daysAgo(Math.max(0, (allStates.length - t) * 2)),
        },
      });
    }
  }

  // ── Seguimientos (follow-ups) ─────────────────────────────────────────────
  const followUpChannels: FollowUpChannel[] = ['WHATSAPP', 'LLAMADA', 'PRESENCIAL', 'EMAIL', 'WHATSAPP'];
  const followUpNotes = [
    'Cliente revisó opciones pero pidió tiempo para decidir.',
    'Se envió cotización por WhatsApp con los 3 modelos que le interesaban.',
    'Visita en tienda. Probó el equipo y le gustó. Vuelve el viernes.',
    'Llamada sin respuesta. Se dejó mensaje de voz.',
    'Cliente confirmó interés. Pide crédito con Codensa.',
    'Se aclararon dudas sobre la garantía y política de devoluciones.',
    'El cliente comparó con otro almacén. Ofrecimos descuento por accesorios.',
    'Primera llamada. Se agendó cita para el martes.',
  ];

  const leadsWithSeller = createdLeads.filter((l) => l.sellerId && l.status !== 'NUEVO');
  await Promise.all(
    leadsWithSeller.slice(0, 12).map((lead, i) =>
      prisma.followUp.create({
        data: {
          companyId: company.id,
          leadId: lead.id,
          sellerId: lead.sellerId!,
          channel: followUpChannels[i % followUpChannels.length],
          notes: followUpNotes[i % followUpNotes.length],
          nextActionAt: i % 2 === 0 ? daysAgo(-2) : null, // -2 = en 2 días
          createdAt: daysAgo(i + 1),
        },
      }),
    ),
  );

  // ── Comentarios internos ───────────────────────────────────────────────────
  const commentBodies = [
    'Coordinadora revisó el caso. Pendiente de aprobación de crédito.',
    'Cliente tiene historial en central de riesgo. Requiere codeudor.',
    'Ya tiene el dinero listo. Solo espera que llegue el equipo en negro.',
    'Hablé con el cliente. Está comparando entre el S24 y el iPhone 14.',
    'El cliente viene mañana a formalizar la compra.',
  ];

  await Promise.all(
    leadsWithSeller.slice(0, 8).map((lead, i) =>
      prisma.internalComment.create({
        data: {
          companyId: company.id,
          leadId: lead.id,
          authorId: i % 2 === 0 ? coordinators[0].id : sellers[i % sellers.length].id,
          body: commentBodies[i % commentBodies.length],
          createdAt: daysAgo(i),
        },
      }),
    ),
  );

  // ── Ventas ────────────────────────────────────────────────────────────────
  const vendidoLeads = createdLeads.filter((l) => l.status === 'VENDIDO' && l.sellerId);
  const saleNotes = [
    'Pago en efectivo. Cliente recibió cargador y case de regalo.',
    'Financiado con Codensa a 24 meses. Entrega inmediata.',
    'Pago con tarjeta de crédito Bancolombia. Sin cuotas de interés.',
    'Transferencia electrónica. Cliente pidió factura electrónica.',
    'Mitad efectivo, mitad transferencia. Entrega el mismo día.',
  ];

  await Promise.all(
    vendidoLeads.map((lead, i) => {
      const product = products[i % products.length];
      return prisma.sale.create({
        data: {
          companyId: company.id,
          officeId: lead.officeId,
          leadId: lead.id,
          sellerId: lead.sellerId!,
          productId: product.id,
          amount: product.price,
          notes: saleNotes[i % saleNotes.length],
          saleDate: daysAgo(i + 1),
          createdAt: daysAgo(i + 1),
        },
      });
    }),
  );
  console.log(`  ✓ ${vendidoLeads.length} ventas registradas`);

  // ── Tareas ────────────────────────────────────────────────────────────────
  const taskDefs = [
    { title: 'Llamar cliente para confirmar entrega', status: 'PENDIENTE' as TaskStatus, daysOffset: -1 },
    { title: 'Enviar cotización actualizada', status: 'EN_PROGRESO' as TaskStatus, daysOffset: 0 },
    { title: 'Gestionar crédito con entidad financiera', status: 'PENDIENTE' as TaskStatus, daysOffset: -3 },
    { title: 'Seguimiento post-venta iPhone 15', status: 'COMPLETADA' as TaskStatus, daysOffset: 5 },
    { title: 'Agendar demostración en tienda', status: 'PENDIENTE' as TaskStatus, daysOffset: -2 },
    { title: 'Revisar disponibilidad en bodega', status: 'EN_PROGRESO' as TaskStatus, daysOffset: 0 },
  ];

  await Promise.all(
    taskDefs.map((task, i) => {
      const lead = createdLeads[i];
      const seller = sellers[i % sellers.length];
      return prisma.task.create({
        data: {
          companyId: company.id,
          title: task.title,
          assignedToId: seller.id,
          createdById: coordinators[i % coordinators.length].id,
          leadId: lead?.id ?? null,
          status: task.status,
          dueDate: daysAgo(task.daysOffset),
          completedAt: task.status === 'COMPLETADA' ? daysAgo(1) : null,
          createdAt: daysAgo(5),
        },
      });
    }),
  );

  // ── Plantillas de mensaje ─────────────────────────────────────────────────
  await prisma.messageTemplate.createMany({
    data: [
      {
        companyId: company.id,
        createdById: admin.id,
        name: 'Bienvenida',
        body: 'Hola {nombre} Te escribimos de {empresa}. ¿Te podemos asesorar con tu próximo equipo?',
      },
      {
        companyId: company.id,
        createdById: admin.id,
        name: 'Cotización enviada',
        body: 'Hola {nombre}, te compartimos la cotización que solicitaste. Recuerda que tenemos financiación disponible.',
      },
      {
        companyId: company.id,
        createdById: admin.id,
        name: 'Reactivación',
        body: '{nombre}, volvemos a contactarte porque tenemos una oferta especial que podría interesarte.',
      },
    ],
  });

  console.log(`  ✓ Empresa completa: ${def.name}`);
  console.log(`     URL demo: http://${def.subdomain}.localhost:4200`);
  console.log(`     Admin: admin@${def.slug}.co → admin / demo1234`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SalesFlow — Seed de empresas demo');
  console.log('═══════════════════════════════════════════════════════');

  for (const [i, companyDef] of COMPANIES.entries()) {
    await dropCompany(companyDef.slug);
    await seedCompany(companyDef, i);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ Seed completo');
  console.log('  Credenciales comunes: demo1234');
  console.log('  Usuarios por empresa: admin, coord1, coord2,');
  console.log('                        vendedor1 … vendedor6');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
