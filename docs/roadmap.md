# Roadmap — SalesFlow Celulares

Leyenda: ✅ realizado · ⏳ en progreso · ⬜ faltante

---

## Fase 0 — Fundación ✅

- [x] Monorepo pnpm (`backend` + `frontend`)
- [x] `schema.prisma` completo + migración `init`
- [x] `PrismaService` / `PrismaModule`
- [x] Guards base: `JwtAuthGuard`, `RolesGuard`, `TenantGuard`
- [x] `GlobalExceptionFilter` + `BusinessError`
- [x] Throttler + Helmet + CORS con credenciales + Swagger
- [x] `JwtStrategy` + `AuthModule` (fundación)
- [x] CI (`.github/workflows/ci.yml`) backend + frontend
- [x] Tests de tenant isolation de guard + base de integración
- [x] Frontend Angular: capa `core` (auth Signals, guards, interceptores), PrimeNG, Jest
- [x] Docs base (`architecture`, `api`, `deployment`, `README`, `AGENTS`, `CLAUDE`)

---

## Fase 1 — Núcleo ✅

**Criterio de éxito:** un vendedor se registra en una empresa, recibe un lead desde la web pública y registra una venta. Empresa A nunca ve datos de B.

### Backend ✅

- [x] `auth` — login (subdominio + username + password), refresh, logout, `/auth/me`
- [x] `common` — DTO de paginación, helper de respuesta paginada, sanitizado de usuario
- [x] `audit` — eventos base de auditoría
- [x] `companies` — CRUD `[SUPERADMIN]`
- [x] `offices` — CRUD `[ADMIN]`
- [x] `users` — CRUD `[ADMIN]` + unicidad username por empresa + asignación oficina
- [x] `products` — CRUD `[ADMIN]`
- [x] `public` — empresa por subdominio, catálogo, oficinas, `POST /public/leads`
- [x] `leads` privado — listado, detalle, creación y cambio de estado
- [x] `sales` — registro de venta transaccional
- [x] seed de SUPERADMIN (`prisma:seed`)

### Frontend ✅

- [x] Login + restauración de sesión
- [x] Layout dashboard con navegación por rol
- [x] Web pública base (home, catálogo, cotización)
- [x] Paneles base: SUPERADMIN, ADMIN, VENDEDOR

---

## Fase 2 — Gestión comercial ✅

**Criterio de éxito:** ADMIN ve métricas reales y compara rendimiento por vendedor y oficina.

- [x] Follow-ups de leads
- [x] `analytics` (company/seller/me)
- [x] `goals` por empresa/oficina/vendedor
- [x] Dashboard ADMIN y VENDEDOR con KPIs
- [x] UI de metas y seguimientos

---

## Fase 3 — Coordinación ✅

**Criterio de éxito:** COORDINADOR detecta leads sin seguimiento y asigna tareas correctivas.

- [x] Dashboard COORDINADOR
- [x] `tasks` con scope por rol
- [x] Comentarios internos de lead
- [x] Alertas de leads >48h sin contacto
- [x] Asignación vendedor <-> coordinador

---

## Fase 4 — Campañas WhatsApp ✅

**Criterio de éxito:** VENDEDOR envía campañas manuales en lotes <= 10.

- [x] `message-templates`
- [x] `campaigns` + historial
- [x] Límite backend de 10 destinatarios (422)
- [x] Generación links `wa.me`

---

## Fase 5 — Personalización web ✅

**Criterio de éxito:** ADMIN personaliza su web sin tocar código.

- [x] `website-config` (GET/PUT)
- [x] `files/upload` con Cloudinary por tenant
- [x] Render público de configuración por subdominio
- [x] **Website Builder v1 implementado**:
  - [x] Backend `website-builder` (pages, sections, reorder, publish/unpublish, preview)
  - [x] Endpoint público `GET /public/website/:subdomain` y `/:pageSlug`
  - [x] Frontend ADMIN con editor por bloques y vista previa

---

## Fase 6 — Next.js para web pública (futuro) ⬜

Condición: >= 5 empresas activas con tráfico real y necesidad demostrada de SEO.

- [ ] App `web/` con Next.js App Router consumiendo la misma API

---

## Estado actual — Web pública MVP comercial demostrable ✅

Estado recomendado: **Web pública MVP lista para demo comercial controlada**.

- [x] Resolución de tenant en frontend por host/subdominio real.
- [x] `?sub` mantenido como fallback/override de desarrollo.
- [x] `/sitio` consume `GET /api/public/website/:subdomain` y hace fallback a `website-config`.
- [x] `/catalogo` implementado (listado, filtros, estados y CTA).
- [x] `/catalogo/:slug` implementado (detalle público de producto).
- [x] `/cotizar` implementado y el frontend no envía `companyId`.
- [x] Copy público sin textos técnicos visibles para cliente final.
- [x] Disponibilidad por oficina comunicada en forma neutral (sin prometer stock exacto por sede).
- [x] Suite frontend vigente: **18 suites / 59 tests pasando**.

---

## Pendientes reales (post Fase 5)

### Frontend y UX

- [ ] Pruebas frontend: ampliar cobertura de componentes y flujos por rol (actualmente mínima)
- [ ] Lazy loading por rol/rutas para reducir bundle inicial
- [ ] Preview externo seguro con token para compartir borradores del Website Builder
- [ ] Mejoras futuras de SEO/copy avanzado (sin migrar stack aún)

### Contratos y consistencia

- [ ] Exponer stock real por producto/oficina en endpoint público (hoy solo oficinas activas + confirmación comercial)
- [ ] Normalización consistente `Decimal -> number` en respuestas API/UI para evitar ambigüedad
- [ ] Matriz de trazabilidad endpoint <-> pantalla <-> tests para reducir drift documental

### Producto (siguientes iteraciones)

- [ ] Mejorar Website Builder admin hacia experiencia tipo Odoo/Shopify
- [ ] Mejorar dashboards internos (lectura de KPIs, jerarquía visual y decisiones operativas)
- [ ] Evaluar Next.js solo en Fase 6 si existe necesidad real de SEO
