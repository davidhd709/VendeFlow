# SalesFlow Celulares

SaaS multitenant para tiendas de celulares: captura leads desde la web pública de cada empresa, organiza el seguimiento comercial y mide rendimiento por vendedor, oficina y empresa.

## Stack y arquitectura actual

Monorepo con **pnpm workspaces** y dos aplicaciones desacopladas:

| App | Stack | Puerto dev |
|---|---|---|
| `backend/` | NestJS + Prisma + PostgreSQL | `http://localhost:3000/api` |
| `frontend/` | Angular 19 + PrimeNG + Signals | `http://localhost:4200` |

La API NestJS es independiente y puede ser consumida en el futuro por otras apps. **Next.js no forma parte del MVP actual** y solo se evalúa en Fase 6 si el SEO lo exige.

## Requisitos

- Node.js >= 20 (probado con 22)
- pnpm >= 9 (probado con 10.14)
- Docker (para Postgres local) o PostgreSQL accesible

## Puesta en marcha

```bash
# 1) Instalar dependencias (workspaces)
pnpm install

# 2) Levantar Postgres local (host:5435)
pnpm db:up

# 3) Configurar entorno backend
cp backend/.env.example backend/.env

# 4) Ejecutar migraciones de desarrollo
pnpm --filter @salesflow/backend prisma:migrate

# 5) Ejecutar apps en desarrollo
pnpm --filter @salesflow/backend start:dev
pnpm --filter @salesflow/frontend start
```

URLs útiles:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- Healthcheck: `http://localhost:3000/api/health`
- Frontend: `http://localhost:4200`

> El contenedor local de Postgres usa el puerto host **5435** para evitar conflicto con otras instancias.

## Comandos útiles (estado actual)

```bash
# raíz del monorepo
pnpm install
pnpm db:up
pnpm db:down
pnpm test

# backend
pnpm --filter @salesflow/backend start:dev
pnpm --filter @salesflow/backend build
pnpm --filter @salesflow/backend test
pnpm --filter @salesflow/backend prisma:migrate
pnpm --filter @salesflow/backend prisma:deploy
pnpm --filter @salesflow/backend prisma:seed
pnpm --filter @salesflow/backend prisma:studio

# frontend
pnpm --filter @salesflow/frontend start
pnpm --filter @salesflow/frontend build
pnpm --filter @salesflow/frontend test
```

## Estado por fases

- **Fase 0 — Fundación:** ✅ completa
- **Fase 1 — Núcleo:** ✅ completa
- **Fase 2 — Gestión comercial:** ✅ completa
- **Fase 3 — Coordinación:** ✅ completa
- **Fase 4 — Campañas WhatsApp:** ✅ completa
- **Fase 5 — Personalización web:** ✅ completa
- **Fase 6 — Next.js web pública:** ⬜ futura/condicional (solo si hay necesidad real de SEO)

Detalle por entregables y pendientes reales: `docs/roadmap.md`.

## Estado web pública (hoy)

Estado recomendado: **Web pública MVP lista para demo comercial controlada**.

- Tenant público resuelto por host/subdominio real.
- `?sub` se mantiene como fallback/override de desarrollo.
- `/sitio` usa Website Builder publicado (`/api/public/website/:subdomain`) con fallback a `website-config`.
- `/catalogo` y `/catalogo/:slug` operativos.
- `/cotizar` operativo (sin enviar `companyId` desde frontend).
- Copy público limpio (sin términos técnicos visibles para cliente final).
- Disponibilidad comunicada de forma neutral mientras no exista stock público por oficina/producto.
- Frontend tests actuales: **18 suites, 59 tests pasando**.

Pendientes relevantes:

- Preview externo seguro con token.
- Stock real por producto/oficina en endpoint público.
- SEO/copy avanzado y posible Next.js solo en Fase 6 (si se justifica).
- Evolución UX del Website Builder admin y dashboards internos.

## Documentación

- `docs/architecture.md` — arquitectura, modelo de datos, auth y fases
- `docs/api.md` — endpoints reales, acceso y tenant isolation
- `docs/deployment.md` — despliegue
- `AGENTS.md` — contexto operativo para Codex
- `CLAUDE.md` — contexto operativo para Claude Code
