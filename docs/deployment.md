# Despliegue — SalesFlow Celulares

## Estado actual para despliegue

Estado recomendado: **Web pública MVP lista para demo comercial controlada**.

Estado funcional público actual:

- `/sitio` implementado.
- `/catalogo` implementado.
- `/catalogo/:slug` implementado.
- `/cotizar` implementado.
- `/sitio` consume Website Builder público (`GET /api/public/website/:subdomain`) y usa fallback a `WebsiteConfig` cuando no hay página publicada.

## Variables de entorno (backend)

Ver `backend/.env.example`. Mínimas para producción:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secretos JWT (≥ 32 chars, distintos entre sí) |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `7d` |
| `CLOUDINARY_*` | Credenciales de Cloudinary (Fase 5) |
| `PORT` | Puerto de la API (default 3000) |
| `FRONTEND_URL` | Origen permitido por CORS (necesario por la cookie del refresh) |
| `COOKIE_DOMAIN` | Dominio de la cookie httpOnly del refresh token |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | Rate limiting (segundos / peticiones) |

Notas de configuración:

- `FRONTEND_URL` debe coincidir con el origen real permitido por CORS.
- `COOKIE_DOMAIN` debe cubrir el dominio raíz y subdominios públicos (según estrategia de dominio del entorno).

## Frontend (Angular)

`frontend/src/environments/environment.ts` define `apiUrl` para producción (default `/api`, asumiendo reverse proxy hacia el backend). En dev se reemplaza por `environment.development.ts` (`http://localhost:3000/api`).

## Resolución de tenant público (producción vs desarrollo)

Resolución actual en frontend público:

1. `?sub` (solo override/fallback de desarrollo).
2. Host/subdominio real (`window.location.hostname`).
3. Estado vacío amigable si no se puede resolver tenant.

En producción:

- La empresa se debe resolver por host/subdominio real.
- Se recomienda DNS wildcard (`*.tudominio.com`) o configuración equivalente.
- El reverse proxy debe **preservar el header `Host`** hasta la app.

Ejemplos de subdominio público:

- `henrycell.tudominio.com`
- `movilesmonteria.tudominio.com`
- `cellstore.tudominio.com`

`?sub` se mantiene únicamente para desarrollo, QA y soporte controlado.

## Build de producción

```bash
pnpm install --frozen-lockfile

# Backend
pnpm --filter @salesflow/backend build
pnpm --filter @salesflow/backend exec prisma migrate deploy   # aplica migraciones
node backend/dist/main.js

# Frontend (artefactos estáticos en frontend/dist/frontend)
pnpm --filter @salesflow/frontend build
```

## Reverse proxy (producción)

Configuración mínima recomendada:

- Servir frontend Angular estático.
- Redirigir `/api` hacia backend NestJS.
- Preservar header `Host`.
- Soportar subdominios públicos.
- Forzar HTTPS.

Checklist de proxy:

- `Host` y `X-Forwarded-*` correctamente propagados.
- Ruta `/api/*` apuntando a backend.
- Resto de rutas apuntando al build estático de Angular.
- Certificados TLS válidos para dominio raíz y subdominios.

## Base de datos

- Local: `pnpm db:up` levanta Postgres 16 en el puerto host **5435** (`docker-compose.yml`).
- Migraciones: `prisma migrate dev` (desarrollo) / `prisma migrate deploy` (producción/CI).
- Nunca commitear datos hardcodeados en migraciones.

## Cookies y CORS

El refresh token viaja en cookie `httpOnly` + `Secure` + `SameSite`.

En producción:

- Frontend y backend deben operar con CORS `credentials: true`.
- `FRONTEND_URL` debe coincidir con el origen real permitido.
- `COOKIE_DOMAIN` debe configurarse para el dominio/subdominios donde se usa la sesión.
- Mantener HTTPS para no invalidar `Secure` en cookies.

## Cloudinary (uploads web)

- Uploads web deben guardarse bajo `salesflow/{companyId}/website/`.
- Las imágenes usadas por `WebsiteConfig` y Website Builder deben provenir de ese scope por tenant.
- No mezclar assets entre tenants.

## CI

`.github/workflows/ci.yml` corre en cada push a `main` y en cada PR:
- **backend:** install → prisma generate → migrate deploy (contra Postgres de servicio) → build → tests (incluye tenant isolation).
- **frontend:** install → build → tests.

Un PR que rompa el aislamiento de tenant no debe mergearse.

## Pendientes de despliegue abiertos

- Preview externo seguro con token para Website Builder (pendiente).
- Stock real por producto/oficina en endpoint público (pendiente).
- Next.js no se despliega en el estado actual; solo se evaluará en Fase 6 si SEO lo exige.
