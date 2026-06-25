# Runbook de producción — SalesFlow

## 1. Objetivo

Este runbook sirve para validar un despliegue real de SalesFlow antes de mostrarlo o usarlo con empresas reales.

## 2. Pre-requisitos

Checklist previo:

- [ ] Dominio principal disponible.
- [ ] DNS wildcard configurado (`*.tudominio.com`) o subdominios públicos creados.
- [ ] VPS/hosting listo para frontend + backend.
- [ ] PostgreSQL disponible y accesible desde backend.
- [ ] Node.js y pnpm disponibles (si el despliegue es por runtime Node).
- [ ] Variables de entorno preparadas.
- [ ] Cloudinary configurado.
- [ ] Certificado HTTPS activo.
- [ ] Reverse proxy configurado.
- [ ] Repositorio actualizado (rama/tag aprobado para release).

## 3. Variables críticas backend

Variables mínimas:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `FRONTEND_URL`
- `COOKIE_DOMAIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `THROTTLE_TTL`
- `THROTTLE_LIMIT`
- `PORT`

Notas:

- `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser distintos.
- `COOKIE_DOMAIN` debe funcionar para subdominios públicos.
- `FRONTEND_URL` debe coincidir exactamente con el origen real permitido.
- CORS debe permitir `credentials`.

## 4. DNS y subdominios

Checklist:

- [ ] Configurar wildcard `*.tudominio.com`.
- [ ] Confirmar que `henrycell.tudominio.com` resuelve al servidor.
- [ ] Confirmar que el proxy preserva el header `Host`.
- [ ] Confirmar que `?sub` se usa solo como fallback de desarrollo.

## 5. Reverse proxy

El proxy en producción debe:

- [ ] Servir Angular estático.
- [ ] Redirigir `/api` al backend NestJS.
- [ ] Preservar `Host`.
- [ ] Soportar subdominios públicos.
- [ ] Forzar HTTPS.
- [ ] Enviar headers correctos para cookies seguras.

Ejemplo de configuración detallada (nginx/caddy/traefik): **pendiente de definir por infraestructura objetivo**.

## 6. Base de datos

Checklist:

- [ ] Validar conexión PostgreSQL.
- [ ] Ejecutar migraciones:
  - `pnpm --filter @salesflow/backend exec prisma migrate deploy`
- [ ] No ejecutar seeds en producción salvo decisión explícita.
- [ ] Verificar que exista superadmin o mecanismo controlado para crearlo.

## 7. Build y arranque

Comandos base:

- `pnpm install --frozen-lockfile`
- `pnpm --filter @salesflow/backend build`
- `pnpm --filter @salesflow/frontend build`
- `pnpm --filter @salesflow/backend exec prisma migrate deploy`

Notas operativas:

- Frontend genera artefactos estáticos.
- Backend expone API bajo `/api`.

## 8. Smoke tests backend

Checklist:

- [ ] `GET /api/health` responde OK.
- [ ] Swagger disponible (si se expone en entorno permitido).
- [ ] Login SUPERADMIN funciona.
- [ ] Login ADMIN de empresa funciona.
- [ ] Refresh token funciona.
- [ ] Logout funciona.
- [ ] CORS con credentials funciona.

## 9. Smoke tests web pública

Checklist:

- [ ] `/sitio` con host/subdominio real.
- [ ] `/catalogo` con host/subdominio real.
- [ ] `/catalogo/:slug` con host/subdominio real.
- [ ] `/cotizar` con host/subdominio real.
- [ ] Fallback `?sub` validado en entorno de desarrollo.
- [ ] `/sitio` renderiza Website Builder publicado (`publishedSnapshot`).
- [ ] `/sitio` usa fallback `WebsiteConfig` si no hay snapshot publicado.
- [ ] Formulario de cotización crea lead sin enviar `companyId` desde frontend.
- [ ] Producto no encontrado muestra mensaje amigable.
- [ ] Catálogo vacío muestra mensaje comercial.

## 10. Smoke tests panel interno

Checklist:

- [ ] SUPERADMIN crea empresa.
- [ ] ADMIN crea oficina.
- [ ] ADMIN crea vendedor.
- [ ] ADMIN crea producto.
- [ ] Cliente público crea lead.
- [ ] VENDEDOR ve lead asignado o por oficina.
- [ ] VENDEDOR registra venta.
- [ ] ADMIN ve métricas.
- [ ] COORDINADOR ve vendedores asignados.
- [ ] Campaña WhatsApp respeta límite de 10.

## 11. Seguridad mínima

Checklist:

- [ ] Usuario de empresa A no ve datos de empresa B.
- [ ] Acceso cross-tenant responde `404`.
- [ ] `companyId` no se acepta desde frontend en rutas sensibles.
- [ ] `passwordHash` no aparece en responses.
- [ ] Refresh token viaja en cookie `httpOnly`.
- [ ] HTTPS activo.
- [ ] CORS limitado al origen esperado.
- [ ] Cloudinary sube assets bajo `salesflow/{companyId}/website/`.

## 12. Pruebas automatizadas antes de go-live

Ejecutar:

- `pnpm --filter @salesflow/backend test`
- `pnpm --filter @salesflow/frontend test`

Registrar resultado antes del go-live:

- Backend crítico: actualizar conteo vigente (referencia conocida: 33 tests passing).
- Frontend actual: actualizar conteo vigente (referencia conocida: 59 tests passing).

## 13. Checklist final de go-live

- [ ] DNS OK.
- [ ] HTTPS OK.
- [ ] API health OK.
- [ ] Migraciones OK.
- [ ] Login OK.
- [ ] Web pública OK.
- [ ] Cotización pública OK.
- [ ] Lead aparece en panel.
- [ ] Venta registrada OK.
- [ ] Tenant isolation verificado.
- [ ] Backups definidos.
- [ ] Variables seguras.
- [ ] Logs revisados.

## 14. Pendientes conocidos

- Preview externo seguro con token.
- Stock real por producto/oficina en endpoint público.
- Next.js solo en Fase 6 si SEO lo exige.
- Pulido futuro del Website Builder admin.
- Dashboards internos más profesionales.

## 15. Evidencia de go-live

Usar esta plantilla en cada despliegue o validación de producción.

### 15.1 Información general

| Campo | Valor |
|---|---|
| Fecha |  |
| Entorno |  |
| Dominio principal |  |
| Empresa/tenant probado |  |
| Responsable técnico |  |
| Responsable funcional/comercial |  |
| Versión o commit desplegado |  |

### 15.2 Resultado de smoke tests

| Validación | Resultado (`OK` / `Falla` / `N/A`) | Evidencia / Nota corta |
|---|---|---|
| API health |  |  |
| Login superadmin |  |  |
| Login admin |  |  |
| Login vendedor |  |  |
| Web pública `/sitio` |  |  |
| Catálogo `/catalogo` |  |  |
| Detalle `/catalogo/:slug` |  |  |
| Cotización `/cotizar` |  |  |
| Creación de lead |  |  |
| Registro de venta |  |  |
| Campañas WhatsApp |  |  |
| Website Builder `publishedSnapshot` |  |  |
| Fallback `WebsiteConfig` |  |  |
| Tenant isolation básico |  |  |

Checklist rápido de cobertura mínima:

- [ ] Se completaron todos los smoke tests críticos.
- [ ] Los fallos (si existen) tienen ticket o plan de mitigación.

### 15.3 Evidencias

| Evidencia | Link / Ruta / Resultado |
|---|---|
| Logs backend |  |
| Logs frontend/proxy |  |
| Capturas (ruta o link) |  |
| Resultado tests backend |  |
| Resultado tests frontend |  |
| Observaciones |  |

### 15.4 Decisión final

- [ ] Aprobado
- [ ] Aprobado con observaciones
- [ ] No aprobado

Motivo / acciones de seguimiento:

-  

### 15.5 Firmas o responsables

| Rol | Nombre | Fecha |
|---|---|---|
| Revisó |  |  |
| Aprobó |  |  |
| Fecha de aprobación |  |  |
