# API — SalesFlow Celulares

Base URL: `http://localhost:3000/api`  
Swagger: `/api/docs`

Contrato de error (global):

```json
{ "statusCode": 404, "error": "NOT_FOUND", "message": "Lead no encontrado", "field": "leadId" }
```

## Reglas de acceso y aislamiento

- `Público`: endpoint con `@Public()`, no requiere JWT.
- `Protegido`: requiere JWT válido (Bearer token).
- `Roles`: además del JWT, valida roles con `@Roles(...)`.
- `Tenant isolation` aplica a todo endpoint tenant-owned:
  - `companyId` se deriva del contexto autenticado (`req.user.companyId`) o del subdominio en rutas públicas.
  - Nunca se confía en `companyId` enviado por cliente.
  - Acceso cruzado entre tenants devuelve `404`.

## Salud del sistema

| Método | Endpoint | Acceso | Tenant isolation |
|---|---|---|---|
| GET | `/api/health` | Público | No aplica |

## Autenticación

| Método | Endpoint | Acceso | Roles | Tenant isolation |
|---|---|---|---|---|
| POST | `/api/auth/login` | Público | N/A | Sí (resuelve empresa por `subdomain`; SUPERADMIN fuera de tenant) |
| POST | `/api/auth/refresh` | Público (cookie refresh) | N/A | Sí |
| POST | `/api/auth/logout` | Protegido | Cualquier autenticado | Sí |
| GET | `/api/auth/me` | Protegido | Cualquier autenticado | Sí |

Login esperado:

```json
{ "subdomain": "acme", "username": "vendedor1", "password": "******" }
```

## Fase 1 — Núcleo (implementado)

### Companies (plataforma)

| Método | Endpoint | Acceso | Roles | Tenant isolation |
|---|---|---|---|---|
| GET | `/api/companies` | Protegido | SUPERADMIN | No aplica (scope plataforma) |
| POST | `/api/companies` | Protegido | SUPERADMIN | No aplica (scope plataforma) |
| PATCH | `/api/companies/:id` | Protegido | SUPERADMIN | No aplica (scope plataforma) |
| PATCH | `/api/companies/:id/status` | Protegido | SUPERADMIN | No aplica (scope plataforma) |

### Public (web pública)

| Método | Endpoint | Acceso | Tenant isolation |
|---|---|---|---|
| GET | `/api/public/companies/by-subdomain/:subdomain` | Público | Sí (subdominio) |
| GET | `/api/public/:subdomain/products` | Público | Sí (subdominio) |
| GET | `/api/public/:subdomain/products/:slug` | Público | Sí (subdominio) |
| GET | `/api/public/:subdomain/offices` | Público | Sí (subdominio) |
| GET | `/api/public/:subdomain/website-config` | Público | Sí (subdominio) |
| POST | `/api/public/leads` | Público | Sí (`companyId` derivado de `subdomain` en body) |

> Nota: estas rutas reemplazan la versión antigua con `companyId` por query param.
>
> Estado frontend actual (Angular):
> - `/sitio` consume `GET /api/public/website/:subdomain` (fallback a `/api/public/:subdomain/website-config`).
> - `/catalogo` consume `GET /api/public/:subdomain/products`.
> - `/catalogo/:slug` consume `GET /api/public/:subdomain/products/:slug`.
> - `/cotizar` usa `POST /api/public/leads` y no envía `companyId`.
> - Resolución de tenant en frontend: `?sub` (dev override) -> host/subdominio real.
>
> Disponibilidad por oficina:
> - La API pública actual no expone stock real por producto/oficina.
> - La UI comunica disponibilidad en forma neutral y confirma stock vía asesor comercial.

### Users / Offices / Products / Leads / Sales

| Método | Endpoint | Roles | Tenant isolation |
|---|---|---|---|
| GET | `/api/users` | ADMIN | Sí |
| POST | `/api/users` | ADMIN | Sí |
| PATCH | `/api/users/:id` | ADMIN | Sí |
| PATCH | `/api/users/:id/status` | ADMIN | Sí |
| GET | `/api/users/:id/sellers` | ADMIN, COORDINADOR | Sí |
| POST | `/api/users/:id/sellers` | ADMIN | Sí |
| DELETE | `/api/users/:id/sellers/:sellerId` | ADMIN | Sí |
| GET | `/api/offices` | ADMIN, COORDINADOR | Sí |
| POST | `/api/offices` | ADMIN | Sí |
| PATCH | `/api/offices/:id` | ADMIN | Sí |
| GET | `/api/products` | ADMIN, VENDEDOR | Sí |
| GET | `/api/products/:id` | ADMIN, VENDEDOR | Sí |
| POST | `/api/products` | ADMIN | Sí |
| PATCH | `/api/products/:id` | ADMIN | Sí |
| GET | `/api/leads` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| GET | `/api/leads/:id` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/leads` | ADMIN, VENDEDOR | Sí |
| PATCH | `/api/leads/:id/status` | VENDEDOR, COORDINADOR | Sí |
| POST | `/api/sales` | VENDEDOR | Sí |
| GET | `/api/sales` | ADMIN, COORDINADOR, VENDEDOR | Sí |

## Fase 2 — Gestión comercial (implementado)

| Método | Endpoint | Roles | Tenant isolation |
|---|---|---|---|
| GET | `/api/leads/:id/follow-ups` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/leads/:id/follow-ups` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| GET | `/api/goals` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/goals` | ADMIN | Sí |
| PATCH | `/api/goals/:id` | ADMIN | Sí |
| GET | `/api/analytics/company` | ADMIN | Sí |
| GET | `/api/analytics/seller/:sellerId` | ADMIN, COORDINADOR | Sí |
| GET | `/api/analytics/me` | VENDEDOR | Sí |

## Fase 3 — Coordinación (implementado)

| Método | Endpoint | Roles | Tenant isolation |
|---|---|---|---|
| GET | `/api/leads/:id/comments` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/leads/:id/comments` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| GET | `/api/tasks` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/tasks` | ADMIN, COORDINADOR | Sí |
| PATCH | `/api/tasks/:id` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| GET | `/api/analytics/coordinator` | COORDINADOR | Sí |

## Fase 4 — Campañas WhatsApp (implementado)

| Método | Endpoint | Roles | Tenant isolation |
|---|---|---|---|
| GET | `/api/message-templates` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/message-templates` | ADMIN | Sí |
| PATCH | `/api/message-templates/:id` | ADMIN | Sí |
| GET | `/api/campaigns` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| GET | `/api/campaigns/:id` | ADMIN, COORDINADOR, VENDEDOR | Sí |
| POST | `/api/campaigns` | VENDEDOR | Sí |

Regla de negocio: `POST /api/campaigns` valida máximo 10 destinatarios (422 si excede).

## Fase 5 — Personalización web (implementado)

### Website Config + Files

| Método | Endpoint | Roles | Tenant isolation |
|---|---|---|---|
| GET | `/api/website-config` | ADMIN | Sí |
| PUT | `/api/website-config` | ADMIN | Sí |
| POST | `/api/files/upload` | ADMIN | Sí (ruta Cloudinary por `companyId`) |

### Website Builder (admin)

| Método | Endpoint | Roles | Tenant isolation |
|---|---|---|---|
| GET | `/api/website-builder/pages` | ADMIN | Sí |
| POST | `/api/website-builder/pages` | ADMIN | Sí |
| GET | `/api/website-builder/pages/:id` | ADMIN | Sí |
| PATCH | `/api/website-builder/pages/:id` | ADMIN | Sí |
| DELETE | `/api/website-builder/pages/:id` | ADMIN | Sí |
| POST | `/api/website-builder/pages/:id/sections` | ADMIN | Sí |
| PATCH | `/api/website-builder/sections/:id` | ADMIN | Sí |
| DELETE | `/api/website-builder/sections/:id` | ADMIN | Sí |
| PATCH | `/api/website-builder/pages/:id/reorder` | ADMIN | Sí |
| POST | `/api/website-builder/pages/:id/publish` | ADMIN | Sí |
| POST | `/api/website-builder/pages/:id/unpublish` | ADMIN | Sí |
| GET | `/api/website-builder/preview/:id` | ADMIN | Sí |

### Website Builder (público)

| Método | Endpoint | Acceso | Tenant isolation |
|---|---|---|---|
| GET | `/api/public/website/:subdomain` | Público | Sí (subdominio) |
| GET | `/api/public/website/:subdomain/:pageSlug` | Público | Sí (subdominio + pageSlug) |

Respuesta esperada (pública):

```json
{
  "theme": { "primaryColor": "#...", "logoUrl": "..." },
  "page": { "slug": "home", "publishedAt": "...", "sections": [...] }
}
```

Si existe empresa pero no hay página publicada, `page` puede ser `null` (fallback del frontend).

## Fase 6 — Futuro (condicional)

No hay endpoints Next.js específicos en backend. Si Fase 6 se activa, Next.js consumirá esta misma API.
