# SalesFlow — Roadmap de completitud

> Estado al 2026-06-18 · Proyecto en ~65% completado

---

## Resumen ejecutivo

| Capa | Estado |
|---|---|
| Backend API | 80% |
| Base de datos / schema | 95% |
| Panel Admin | 80% |
| Panel Coordinador | 65% |
| Panel Vendedor | 65% |
| Panel Superadmin | 45% |
| Sitio público | 65% |
| Tests | 35% |
| **Total** | **~65%** |

---

## Fase 1 — Completar el CRM core (lo que bloquea el uso real)

Estas son las piezas que hacen falta para que una tienda real pueda usar el producto día a día.

### 1.1 Flujo de cotización pública → lead mejorado

**Problema actual:** El formulario de cotización crea leads correctamente, pero si el admin no ha configurado su sitio con al menos una oficina activa, el formulario aparece vacío o falla silenciosamente.

**Qué construir:**
- [ ] Validar en el backend que la empresa tiene al menos una oficina activa antes de devolver el formulario público
- [ ] Mostrar un estado de "empresa aún no configurada" en el sitio público si no hay oficinas
- [ ] Confirmar al visitante que la cotización fue recibida (pantalla de éxito con nombre del asesor o tiempo estimado de respuesta)
- [ ] Email de confirmación al visitante (opcional para MVP, depende de si tienen SMTP configurado)

**Archivos:**
- `backend/src/public/public.service.ts` — agregar validación de oficinas activas
- `frontend/src/app/features/public/quote/quote.component.ts` — pantalla de éxito
- `frontend/src/app/features/public/site/public-site.component.ts` — estado vacío

---

### 1.2 Tareas — integración coordinador → vendedor

**Problema actual:** El módulo de tareas existe (backend + frontend) pero el coordinador no puede crear tareas desde su dashboard directamente sobre un lead o vendedor específico. Solo hay un listado genérico.

**Qué construir:**
- [ ] Botón "Asignar tarea" en el detalle de un lead (visible para COORDINADOR y ADMIN)
- [ ] Al crear una tarea desde un lead, el `leadId` se prerrellena automáticamente
- [ ] Notificación al vendedor cuando se le asigna una tarea
- [ ] El dashboard del vendedor muestra las tareas vencidas con urgencia visual
- [ ] El dashboard del coordinador muestra tareas sin completar por vendedor

**Archivos:**
- `frontend/src/app/features/leads/lead-detail.component.ts` — botón de asignar tarea
- `frontend/src/app/features/coordinador/dashboard.component.ts` — panel de tareas
- `frontend/src/app/features/vendedor/dashboard.component.ts` — lista de tareas urgentes
- `backend/src/notifications/notifications.service.ts` — notificación de tarea asignada

---

### 1.3 Metas mensuales — completar el ciclo

**Problema actual:** El CRUD de metas existe. Faltan la visualización en tiempo real del progreso en el dashboard del vendedor y la comparativa del coordinador.

**Qué construir:**
- [ ] Barra de progreso en el dashboard del vendedor: `X ventas / meta del mes`
- [ ] En el dashboard del coordinador: tabla con progreso de cada vendedor vs su meta
- [ ] Indicador visual cuando un vendedor supera la meta (celebración simple)
- [ ] Historial de metas cumplidas vs no cumplidas por mes

**Archivos:**
- `frontend/src/app/features/vendedor/dashboard.component.ts` — barra de meta
- `frontend/src/app/features/coordinador/dashboard.component.ts` — tabla comparativa
- `backend/src/goals/goals.service.ts` — endpoint de progreso actual

---

### 1.4 Registro de ventas — campos faltantes

**Problema actual:** El registro de venta funciona pero le faltan campos importantes para reportes completos.

**Qué construir:**
- [ ] Campo `notes` en la venta (qué se vendió exactamente, accesorios incluidos, etc.)
- [ ] Selección de producto desde el catálogo de la empresa (no solo texto libre)
- [ ] Ver el historial de ventas del cliente en su detalle de lead
- [ ] Descargar lista de ventas en CSV desde el panel de admin

**Archivos:**
- `backend/src/sales/dto/create-sale.dto.ts` — agregar campos
- `frontend/src/app/features/leads/lead-detail.component.ts` — diálogo de venta mejorado
- `frontend/src/app/features/sales/sales-list.component.ts` — exportar CSV

---

## Fase 2 — Panel Superadmin completo

El superadmin actualmente solo puede ver y crear empresas. Para que el SaaS sea operable hay que darle visibilidad y control.

### 2.1 Dashboard de métricas globales

- [ ] Total de empresas activas / suspendidas
- [ ] Total de leads creados en los últimos 30 días (plataforma global)
- [ ] Total de ventas registradas (monto global)
- [ ] Empresas más activas (por leads creados)
- [ ] Empresas sin actividad en los últimos 14 días (candidatas a churn)

**Archivos:**
- `backend/src/companies/companies.service.ts` — métodos de métricas globales
- `frontend/src/app/features/superadmin/` — crear `dashboard.component.ts`
- `frontend/src/app/app.routes.ts` — agregar ruta `/superadmin/dashboard`

---

### 2.2 Gestión de empresa — detalle completo

- [ ] Ver todos los usuarios de una empresa desde el panel superadmin
- [ ] Suspender / reactivar una empresa
- [ ] Resetear la contraseña de un admin de empresa
- [ ] Ver audit log de una empresa específica

**Archivos:**
- `frontend/src/app/features/superadmin/companies.component.ts` — expandir detalle
- `backend/src/companies/companies.controller.ts` — endpoints de suspensión

---

### 2.3 Audit log global

- [ ] El superadmin puede ver todas las acciones críticas de todas las empresas
- [ ] Filtros: por empresa, por tipo de acción, por fecha
- [ ] El admin solo ve su propia empresa (ya funciona)

**Archivos:**
- `backend/src/audit/audit.controller.ts` — endpoint global para SUPERADMIN
- `frontend/src/app/features/superadmin/` — crear `audit.component.ts`

---

## Fase 3 — Sitio público pulido

El sitio público es el punto de entrada de leads. Tiene que funcionar bien aunque el admin no haya configurado nada avanzado.

### 3.1 Estado por defecto funcional

- [ ] Si el admin no ha configurado el website builder, el sitio público muestra un tema por defecto con los datos básicos de la empresa (nombre, productos, formulario de cotización)
- [ ] No debe aparecer en blanco ni con errores

**Archivos:**
- `backend/src/website-config/website-config.service.ts` — retornar config por defecto
- `frontend/src/app/features/public/site/public-site.component.ts` — estado vacío graceful

---

### 3.2 Página de detalle de producto — completa

- [ ] Mostrar especificaciones técnicas (RAM, almacenamiento, procesador, etc.)
- [ ] Botón de "Solicitar cotización" que pre-rellena el producto en el formulario
- [ ] Galería de imágenes si el producto tiene varias

**Archivos:**
- `frontend/src/app/features/public/product-detail/product-detail.component.ts`
- `backend/src/public/public.controller.ts` — endpoint de producto por slug

---

### 3.3 Onboarding del admin — flujo guiado

**Problema:** Una empresa nueva que llega al panel no sabe por dónde empezar.

- [ ] Al primer login del admin, mostrar un checklist de configuración inicial:
  - [ ] Crear al menos una oficina
  - [ ] Agregar al menos un producto
  - [ ] Crear al menos un vendedor
  - [ ] Configurar nombre del sitio público
- [ ] El checklist desaparece cuando todos los items están completados
- [ ] Enlace directo desde cada item del checklist a la pantalla correspondiente

**Archivos:**
- `frontend/src/app/features/admin/dashboard.component.ts` — agregar checklist de onboarding
- `backend/src/companies/companies.service.ts` — endpoint de estado de configuración

---

## Fase 4 — Tests

Los tests actuales son unitarios con mocks. Para deployar con confianza se necesitan tests de integración reales.

### 4.1 Tests de tenant isolation (crítico)

- [ ] Test que crea 2 empresas con datos similares y verifica que ninguna puede ver datos de la otra
- [ ] Test que intenta acceder a un lead de otra empresa con un token válido → debe recibir 404
- [ ] Test que intenta usar el `companyId` de otra empresa en el body → debe ignorarse

**Archivo:** `backend/test/tenant-isolation.spec.ts` — expandir los existentes

---

### 4.2 Tests E2E del flujo principal

- [ ] Test del flujo completo: visitante llena formulario → lead se crea → vendedor lo ve → registra venta
- [ ] Test de que el cambio de estado de lead se loguea en el historial
- [ ] Test de que una venta actualiza el lead a VENDIDO atómicamente

---

### 4.3 Tests de regresión de seguridad

- [ ] Verificar que ningún endpoint devuelve `passwordHash`
- [ ] Verificar que ningún endpoint devuelve datos de otra empresa aunque se cambie el ID en la URL
- [ ] Verificar que el refresh token se revoca al hacer logout

---

## Fase 5 — Deploy y operación

Sin esto el proyecto existe solo en local.

### 5.1 Infraestructura

- [ ] `Dockerfile` para el backend (NestJS)
- [ ] `Dockerfile` para el frontend (Angular con nginx)
- [ ] `docker-compose.prod.yml` — postgres + backend + frontend + nginx reverse proxy
- [ ] Variables de entorno documentadas en `.env.example` completo
- [ ] Script de migración automática en el startup del backend

**Archivos:**
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.prod.yml`

---

### 5.2 CI/CD básico

- [ ] GitHub Actions: lint + tests en cada PR
- [ ] GitHub Actions: build de Docker en merge a main
- [ ] Deploy automático a VPS o Railway/Render

**Archivo:** `.github/workflows/ci.yml`

---

### 5.3 Configuración de subdominios

- [ ] Documentar cómo configurar nginx para `*.salesflow.app` → resolver empresa por subdomain
- [ ] En producción, el frontend debe leer el subdomain del hostname y pasarlo al login automáticamente (ya funciona en desarrollo)

---

## Fase 6 — Post-MVP (cuando haya uso real)

No construir hasta tener empresas activas que lo pidan.

| Feature | Cuándo construirlo |
|---|---|
| WhatsApp API (Twilio / Meta) | Cuando las campañas manuales no escalen |
| Notificaciones push (PWA) | Cuando los vendedores pidan alertas en móvil |
| App móvil | Cuando > 3 empresas lo soliciten explícitamente |
| Next.js para sitio público | Cuando el SEO sea un problema medible |
| n8n automations | Cuando una empresa pida seguimiento automático |
| Facturación / planes de suscripción | Cuando haya > 5 empresas pagando |
| IA de recomendación de leads | Cuando el dataset tenga > 6 meses de datos |
| Integración con Google Calendar | Cuando las tareas no sean suficientes |

---

## Orden de prioridad recomendado

```
Sprint actual → Fase 1 (tareas + metas + ventas)
Sprint 2      → Fase 2 (superadmin dashboard)
Sprint 3      → Fase 3 (sitio público + onboarding)
Sprint 4      → Fase 4 (tests de integración)
Sprint 5      → Fase 5 (deploy)
Después       → Fase 6 según demanda
```

---

## Lo que YA funciona y NO hay que tocar

- Auth completa: login, refresh, rotación, revocación, cambio de contraseña
- Multitenant isolation verificado con Playwright
- Leads: CRUD completo, estados, historial, asignación
- Follow-ups y comentarios con notificaciones
- Campañas de reactivación (4 tipos de targeting)
- Analytics: KPIs, gráficas por oficina/vendedor
- Website builder visual
- Alertas inteligentes (sin contacto > 48h)
- Panel de notificaciones en dashboard
- Gestión completa de usuarios, oficinas, productos, plantillas
