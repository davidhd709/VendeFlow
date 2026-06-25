# Arquitectura — SalesFlow Celulares

## Visión

SaaS multitenant para tiendas de celulares. Cada empresa (tenant) tiene su web pública, subdominio, oficinas, usuarios, productos, leads, ventas, métricas y configuración visual. El objetivo del MVP: capturar más leads, organizar el seguimiento, medir el rendimiento y registrar ventas.

Fuente de verdad del dominio: `.agents/skills/salesflow-domain/SKILL.md`.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (paneles + web pública) | Angular 19, PrimeNG, Signals |
| Backend (API REST) | NestJS, Prisma |
| Base de datos | PostgreSQL |
| Almacenamiento de archivos | Cloudinary (Fase 5) |
| WhatsApp | enlaces `wa.me` (manual, Fase 4) |
| Automatización (futuro) | n8n |

## Repositorio

Monorepo con **pnpm workspaces**: `backend/` y `frontend/` independientes. La lista de builds nativos permitidos (pnpm 10 ignora postinstall por defecto) está en `pnpm-workspace.yaml`.

```
salesflow/
├── backend/      NestJS + Prisma
├── frontend/     Angular
├── docs/
├── .github/workflows/ci.yml
├── docker-compose.yml   Postgres local (host:5435)
└── CLAUDE.md
```

El backend es una API independiente: no se acopla a Angular y expone Swagger en `/api/docs`.

## Frontend ahora, Next.js después

Angular es el frontend actual de paneles internos y web pública. **Next.js NO se introduce en el MVP.** Solo se evaluará en Fase 6 para la web pública, condicionado a necesidad real de SEO (>= 5 empresas activas con tráfico).

Cuando llegue ese momento, Next.js consumirá la misma API NestJS sin cambios de backend; los paneles internos continúan en Angular.

## Estado real de la web pública (MVP)

La web pública Angular está en estado **MVP comercial demostrable** para demos controladas.

- Resolución de tenant en frontend:
  1. `?sub` (override/fallback de desarrollo)
  2. subdominio real del host
  3. estado vacío amigable si no se puede resolver tenant
- `/sitio` consume `GET /api/public/website/:subdomain` y usa fallback a `website-config` si no hay página publicada o falla la carga.
- `/catalogo` y `/catalogo/:slug` consumen endpoints públicos de catálogo y detalle.
- `/cotizar` crea lead público por subdominio y **no envía `companyId`**.
- El copy público evita términos técnicos visibles al cliente final.
- La disponibilidad por oficina se comunica de forma neutral; la API pública todavía no expone stock real por producto/oficina.

## Roles

Cuatro roles (definición autoritativa en `salesflow-domain`): `SUPERADMIN`, `ADMIN`, `COORDINADOR`, `VENDEDOR`.

## Autenticación y propagación de tenant

- **Login por `username` + `password`** (no email). La empresa se resuelve por **subdominio**; luego se busca usuario por `(companyId, username)`.
- SUPERADMIN inicia sesión fuera del contexto de subdominio (`companyId = null`); su unicidad de username se valida en servicio.
- Se emiten:
  - **Access token JWT (15m)** con payload `{ sub, username, role, companyId, officeId }` (memoria en Angular).
  - **Refresh token (7d)** en cookie `httpOnly + Secure + SameSite`, persistido hasheado en `RefreshToken` (rotación/revocación).
- `JwtStrategy` pobla `req.user: AuthUser`.
- Guards globales: `ThrottlerGuard -> JwtAuthGuard -> RolesGuard`.
- Rutas `public/*`: sin JWT (`@Public()`), resolviendo tenant por subdominio/slug.

## Aislamiento de tenant (regla n. 1)

Un usuario de Empresa A nunca debe leer, escribir ni inferir datos de Empresa B.

- `companyId` siempre se deriva de `req.user`, nunca del body/params.
- Toda query tenant-owned incluye `companyId` en `where`.
- VENDEDOR además filtra por `sellerId`/`officeId`; COORDINADOR por `SellerAssignment`.
- Acceso cruzado debe responder **404** (no 403).

## Modelo de datos

Esquema completo: `backend/prisma/schema.prisma`.

Enums principales:

- `Role`, `CompanyStatus`, `LeadStatus`, `TaskStatus`, `CampaignStatus`, `ProductCondition`, `FollowUpChannel`
- `WebsitePageStatus`, `WebsiteSectionType`

Entidades principales:

- **Tenant:** `Company`, `User`, `SellerAssignment`, `Office`.
- **Catálogo / inventario:** `Product`, `ProductStock`.
- **CRM:** `Lead`, `LeadProductInterest`, `FollowUp`, `LeadStatusHistory`, `Sale`, `Task`, `InternalComment`.
- **Campañas:** `MessageTemplate`, `Campaign`, `CampaignRecipient`.
- **Metas:** `MonthlyGoal`.
- **Web pública configurable:** `WebsiteConfig`.
- **Website Builder (CMS controlado):**
  - `WebsitePage` (estado draft/published, `publishedSnapshot`)
  - `WebsiteSection` (bloques por tipo y orden)
- **Seguridad:** `AuditLog`, `RefreshToken`.

## Manejo de errores

Contrato único: `{ statusCode, error, message, field? }`.

`GlobalExceptionFilter` normaliza respuestas y evita exposición de stack traces. El `errorInterceptor` de Angular agrega `userMessage` para UI.

## Fases

| Fase | Objetivo | Estado |
|---|---|---|
| 0 — Fundación | Monorepo, esquema + migración, guards base, CI, tenant isolation | ✅ Completa |
| 1 — Núcleo | auth, companies, offices, users, products, leads, sales + paneles base | ✅ Completa |
| 2 — Gestión comercial | follow-ups, analytics, goals, dashboards ADMIN/VENDEDOR | ✅ Completa |
| 3 — Coordinación | panel COORDINADOR, tasks, comentarios internos, alerta >48h, asignación | ✅ Completa |
| 4 — Campañas WhatsApp | templates, campaigns, límite 10, links `wa.me` | ✅ Completa |
| 5 — Personalización web | website-config, files/cloudinary, website-builder, preview/public snapshot | ✅ Completa |
| 6 — Next.js (futuro) | web pública con SSR solo si SEO lo exige | Condicional |
