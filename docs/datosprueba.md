# Datos de prueba — SalesFlow Demo

## Cómo cargar los datos

```bash
# Desde la raíz del monorepo
pnpm --filter @salesflow/backend exec ts-node -r tsconfig-paths/register prisma/seed-demo.ts
```

El script es **idempotente**: borra y recrea las 3 empresas cada vez que se ejecuta. No afecta al SUPERADMIN ni a otras empresas que existan en la base de datos.

---

## Empresas creadas

| | CelTech Medellín | PhoneZone Bogotá | MovilTop Cali |
|---|---|---|---|
| Subdominio | `celtech` | `phonezone` | `moviltop` |
| Estado | ACTIVE | ACTIVE | TRIAL |
| Oficinas | 3 (Centro, Norte, Sur) | 3 | 3 |
| Admin | `admin / demo1234` | `admin / demo1234` | `admin / demo1234` |
| Coordinadores | `coord1`, `coord2` | igual | igual |
| Vendedores | `vendedor1`–`vendedor6` | igual | igual |
| Productos | 8 (iPhone, Samsung, Moto, Xiaomi, Pixel) | 8 | 8 |
| Stock | por cada producto × 3 oficinas | igual | igual |
| Leads | 20 (mix de todos los estados) | 20 | 20 |
| Ventas | 5 con notas y producto asociado | 5 | 5 |
| Seguimientos | 12 follow-ups con distintos canales | 12 | 12 |
| Tareas | 6 (PENDIENTE, EN\_PROGRESO, COMPLETADA) | 6 | 6 |
| Metas | 3 × oficina + 6 × vendedor | igual | igual |
| Plantillas | 3 (Bienvenida, Cotización, Reactivación) | 3 | 3 |

---

## Credenciales por empresa

Todas las empresas usan la misma contraseña: **`demo1234`**

| Rol | Username | Acceso |
|---|---|---|
| Admin | `admin` | Panel completo de la empresa |
| Coordinador | `coord1` | Dashboard coordinador + sus oficinas |
| Coordinador | `coord2` | Dashboard coordinador + sus oficinas |
| Vendedor | `vendedor1` | Leads y ventas de su oficina |
| Vendedor | `vendedor2` | Leads y ventas de su oficina |
| Vendedor | `vendedor3` | Leads y ventas de su oficina |
| Vendedor | `vendedor4` | Leads y ventas de su oficina |
| Vendedor | `vendedor5` | Leads y ventas de su oficina |
| Vendedor | `vendedor6` | Leads y ventas de su oficina |

Para hacer login se necesita indicar el subdominio de la empresa correspondiente.

---

## Distribución de leads por estado

Cada empresa tiene 20 leads distribuidos así:

| Estado | Cantidad |
|---|---|
| NUEVO | 3 (sin vendedor asignado) |
| CONTACTADO | 3 |
| EN\_SEGUIMIENTO | 2 |
| INTERESADO | 3 |
| VENDIDO | 5 (con venta registrada) |
| PERDIDO | 2 |
| SIN\_RESPUESTA | 2 |

---

## Productos del catálogo

Cada empresa tiene los mismos 8 modelos con precios en COP:

| Producto | Condición | Precio |
|---|---|---|
| iPhone 15 Pro Max 256GB Titanio | Nuevo | $6.500.000 |
| iPhone 14 128GB Azul | Nuevo | $3.900.000 |
| Samsung Galaxy S24 Ultra 256GB | Nuevo | $5.800.000 |
| Samsung Galaxy A54 5G 128GB | Nuevo | $1.750.000 |
| Motorola Edge 40 256GB Negro | Nuevo | $1.490.000 |
| Xiaomi Redmi Note 12 128GB | Nuevo | $850.000 |
| iPhone 13 128GB (reacondicionado) | Reacondicionado | $2.100.000 |
| Google Pixel 8 256GB Obsidiana | Nuevo | $3.200.000 |

---

## Notas de desarrollo

- **MovilTop Cali** tiene estado `TRIAL` — útil para probar el comportamiento del superadmin con empresas en período de prueba.
- Los leads con estado `NUEVO` no tienen vendedor asignado — útil para probar el flujo de asignación.
- Las metas mensuales se crean para el mes actual — el dashboard de coordinador debería mostrarlas inmediatamente.
- Los follow-ups tienen distintos canales: WHATSAPP, LLAMADA, PRESENCIAL, EMAIL.
- El script se puede ejecutar en cualquier entorno que tenga `DATABASE_URL` configurada (local, staging, CI).
