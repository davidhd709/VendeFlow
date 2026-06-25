# Demo Script — SalesFlow Celulares

## 1. Objetivo de la demo

Esta demo muestra cómo SalesFlow ayuda a una tienda de celulares a:

- captar clientes desde una web pública,
- mostrar catálogo,
- recibir cotizaciones,
- gestionar leads,
- controlar vendedores,
- medir ventas,
- editar su web sin tocar código.

## 2. Perfil del cliente objetivo

Cliente ideal para esta demo:

- tienda de celulares,
- varios vendedores,
- una o varias oficinas,
- ventas por WhatsApp,
- necesidad de controlar leads, ventas y seguimiento comercial.

## 3. Dolor inicial

Hoy muchas tiendas solo venden a quienes llegan al local o escriben por WhatsApp. El problema es que muchos clientes se pierden porque no quedan registrados, no hay seguimiento y el dueño no sabe qué vendedor está convirtiendo mejor.

## 4. Flujo de demo sugerido

### Minuto 0–1: Presentación del problema

- Explicar el problema comercial: clientes se enfrían por falta de registro y seguimiento.
- Presentar la promesa de SalesFlow: capturar, dar seguimiento y medir.

Mensaje clave:
“SalesFlow convierte conversaciones sueltas en un proceso comercial ordenado.”

### Minuto 1–3: Web pública de la empresa

Mostrar:

- `/sitio`
- `/catalogo`
- `/catalogo/:slug`
- `/cotizar`
- botón/CTA a WhatsApp

Mensaje clave:
“La tienda deja de depender solo de personas que llegan al local y empieza a capturar interesados desde su propia web.”

### Minuto 3–4: Cotización y creación de lead

Mostrar:

- formulario de cotización,
- selección de oficina,
- creación de lead en el flujo real.

Aclaración técnica comercial:

- el frontend no envía `companyId`,
- el backend deriva empresa/oficina por contexto seguro.

Mensaje clave:
“Cada solicitud queda registrada y asociada a una empresa, oficina y vendedor.”

### Minuto 4–5: Panel vendedor

Mostrar:

- clientes pendientes,
- cambio de estado del lead,
- registro de seguimiento,
- registro de venta,
- campañas de WhatsApp (límite MVP de 10 contactos por lote).

Mensaje clave:
“El vendedor sabe a quién contactar, qué clientes están pendientes y cómo avanzar cada oportunidad.”

### Minuto 5–6: Panel coordinador

Mostrar:

- clientes sin seguimiento,
- tareas vencidas,
- vendedores que necesitan apoyo,
- rendimiento del equipo.

Mensaje clave:
“El coordinador puede detectar rápido dónde se están perdiendo ventas.”

### Minuto 6–7: Panel admin

Mostrar:

- ventas del mes,
- leads nuevos,
- avance de meta,
- rendimiento por vendedor,
- rendimiento por oficina,
- productos con más interés.

Mensaje clave:
“El dueño ya no toma decisiones a ciegas; ve cómo está vendiendo su empresa.”

### Minuto 7–8: Website Builder

Mostrar:

- editor web,
- lista de secciones,
- preview central,
- edición de contenido,
- publicar cambios,
- control de footer y contenido publicado.

Mensaje clave:
“La empresa puede actualizar su web sin depender de un programador.”

### Minuto 8–9: Valor SaaS multiempresa

Explicar:

- cada empresa tiene su propia web,
- su propio subdominio,
- sus propios usuarios,
- sus propios productos,
- sus propios clientes,
- aislamiento de datos por tenant.

Mensaje clave:
“SalesFlow puede servir para muchas tiendas sin mezclar datos.”

### Minuto 9–10: Cierre comercial

Cierre recomendado:

“Con SalesFlow, la tienda no solo publica celulares; organiza todo su proceso comercial desde el primer contacto hasta la venta.”

## 5. Frases clave para la demo

- “Cada lead que entra queda registrado.”
- “El vendedor deja de depender de memoria o chats sueltos.”
- “El coordinador sabe dónde actuar hoy.”
- “El dueño ve ventas, metas y rendimiento en un solo lugar.”
- “La web pública se puede editar desde el panel.”
- “Cada empresa trabaja de forma aislada y segura.”

## 6. Preguntas que puede hacer un dueño de tienda

1. ¿Esto reemplaza WhatsApp?  
Respuesta: No. SalesFlow usa WhatsApp como canal comercial, pero agrega control del proceso (registro, seguimiento y métricas).

2. ¿Puedo tener varias oficinas?  
Respuesta: Sí. Los leads se asocian a oficina y puedes medir rendimiento por sede.

3. ¿Puedo saber qué vendedor vende más?  
Respuesta: Sí. El panel administrativo muestra rendimiento por vendedor y avance por meta.

4. ¿Puedo cambiar los banners de mi web?  
Respuesta: Sí. Desde configuración web y Website Builder, sin tocar código.

5. ¿Puedo subir productos?  
Respuesta: Sí. El admin gestiona catálogo por empresa.

6. ¿Los clientes quedan guardados?  
Respuesta: Sí. Cada cotización o alta manual crea/actualiza lead para seguimiento.

7. ¿Puedo ver ventas por mes?  
Respuesta: Sí. El dashboard muestra ventas del periodo y avance frente a meta.

8. ¿Esto sirve para varias empresas?  
Respuesta: Sí. Es un SaaS multitenant con aislamiento de datos por empresa.

9. ¿Puedo usar mi propio dominio?  
Respuesta: Sí. Con configuración de DNS/HTTPS y proxy en producción.

10. ¿Qué falta para producción?  
Respuesta: Cerrar pendientes de go-live del runbook (preview externo seguro, stock real por producto/oficina, validaciones finales de infraestructura).

## 7. Objeciones comunes

1. “Yo ya vendo por WhatsApp.”  
Respuesta: Perfecto. SalesFlow no te quita WhatsApp, te da orden y trazabilidad para vender más con el mismo canal.

2. “Mis vendedores ya tienen sus clientes.”  
Respuesta: SalesFlow ayuda a que ese conocimiento no dependa de una sola persona y se convierta en un proceso medible.

3. “No quiero algo complicado.”  
Respuesta: El MVP está enfocado en flujo simple: captar, seguir, vender y medir. Interfaz por rol y acciones claras.

4. “No tengo presupuesto al inicio.”  
Respuesta: Puedes iniciar con el flujo esencial (web + leads + seguimiento + ventas) y crecer por etapas.

5. “No quiero perder el control de mis clientes.”  
Respuesta: SalesFlow te da más control: todo lead queda registrado, con responsable, estado e historial.

## 8. Estado actual del producto

- Web pública MVP demostrable.
- Catálogo + detalle + cotización implementados.
- Website Builder admin MVP funcional y presentable.
- Dashboards MVP por rol (ADMIN, COORDINADOR, VENDEDOR).
- Tests frontend y backend pasando en validaciones recientes.
- Runbook de producción creado.

## 9. Pendientes honestos

- Preview externo seguro con token.
- Stock real por producto/oficina.
- Dashboards con métricas más avanzadas.
- Posible Next.js en Fase 6 si SEO lo exige.
- Integración futura con WhatsApp API/n8n.

## 10. Checklist antes de hacer la demo

- [ ] Levantar backend.
- [ ] Levantar frontend.
- [ ] Tener empresa demo activa.
- [ ] Tener productos demo cargados.
- [ ] Tener oficinas demo activas.
- [ ] Tener usuarios por rol (ADMIN, COORDINADOR, VENDEDOR).
- [ ] Tener leads demo para mostrar seguimiento.
- [ ] Tener ventas demo para mostrar métricas.
- [ ] Publicar website snapshot de la empresa demo.
- [ ] Probar rutas públicas: `/sitio`, `/catalogo`, `/catalogo/:slug`, `/cotizar`.

