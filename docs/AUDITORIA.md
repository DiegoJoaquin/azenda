# Auditoría técnica de producción — Azenda

Fecha: julio 2026. Alcance: los 5 dominios críticos de un SaaS de reservas
multi-tenant. Cada hallazgo indica su estado tras las correcciones aplicadas
en esta auditoría (migración `0004_auditoria.sql` + código).

---

## 1. Arquitectura multi-tenant

| Hallazgo | Severidad | Estado |
|---|---|---|
| Aislamiento por `business_id` + RLS en todas las tablas, con funciones `is_member`/`is_active_member` (security definer, search_path fijo) | — | ✅ Correcto desde 0001/0003 |
| Reserva pública solo vía RPC transaccional; datos de clientes jamás legibles por anónimos; disponibilidad pública servida anonimizada (`get_busy_intervals`) | — | ✅ Correcto |
| Lecturas públicas de horarios/servicios/categorías exponían datos de TODOS los tenants (incluidos negocios pausados o vencidos) | Media | ✅ Corregido: `is_public_business()` — solo negocios publicables y al día |
| `staff_services` se consultaba sin filtro de tenant en el snapshot del panel (se filtraba en cliente) | Baja | ✅ Mitigado por la nueva política; el filtro client-side se mantiene como defensa extra |

**Veredicto:** aislamiento fuerte. No se encontró ninguna vía de lectura o
escritura cruzada entre tenants tras 0003 + 0004 (el trigger
`trg_item_integrity` cubre además el caso de datos mixtos dentro de una cita).

## 2. Integridad de reservas y concurrencia

| Hallazgo | Severidad | Estado |
|---|---|---|
| Race conditions al reservar la misma hora | — | ✅ Cubierto: `pg_advisory_xact_lock` por profesional + verificación de solapamiento (citas con buffers y bloqueos) dentro de la misma transacción. Doble validación: optimista en cliente, definitiva en servidor. |
| Validación server-side de turnos, anticipación mín/máx y pertenencia servicio↔profesional | — | ✅ Cubierto desde 0003 |
| **Zonas horarias**: el servidor valida turnos en la zona del negocio y todo se persiste en UTC (`timestamptz`), pero la grilla del cliente se pinta en la zona del navegador. Un cliente en otro país vería horas desplazadas (el servidor rechazaría reservas inválidas, pero la UX confunde) | Media (baja para mercado chileno) | ⚠️ Mitigado: aviso visible cuando la zona del visitante difiere de la del negocio. Fix completo (motor render en tz del negocio) queda como deuda técnica documentada. |

## 3. Autenticación, autorización y seguridad

| Hallazgo | Severidad | Estado |
|---|---|---|
| **RBAC declarado pero no aplicado**: los roles owner/admin/staff existían en `memberships` pero cualquier miembro podía editar la configuración del negocio | Alta | ✅ Corregido: `is_admin_member()` — solo owner/admin actualizan `businesses`; la UI oculta Finanzas y Configuración al rol staff |
| Escalada del modelo de cobro (`plan_status`) | Crítica | ✅ Corregido en 0003 (grants por columna) |
| Validación de inputs server-side (formato, largos, formatos de email) | — | ✅ En `book_appointment` y `create_business` |
| Rate limiting de reservas (por cliente y por negocio) | — | ✅ En 0003; auth con rate limits nativos de Supabase |
| OWASP: XSS (React + CSP), clickjacking, HSTS, nosniff, sin `service_role` en cliente | — | ✅ Cubierto en el blindaje previo |
| Confirmación de email desactivada (posible registro con correo ajeno) | Media | ⚠️ Pendiente consciente: reactivar al activar Resend (documentado en SECURITY.md) |

## 4. Escalabilidad y procesamiento asíncrono

| Hallazgo | Severidad | Estado |
|---|---|---|
| **No existía sistema de notificaciones ni colas**: cualquier envío habría quedado acoplado al request | Alta | ✅ Construido: patrón **outbox** — triggers en la base encolan (`notification_outbox`, idempotente por índice único), un worker (`/api/notifications/process`) procesa con reintentos (máx. 3) y registro de errores. El hilo de la reserva **nunca** espera un correo. |
| Confirmaciones en tiempo real con cron diario del plan Hobby de Vercel | — | ✅ Resuelto: la reserva dispara un "kick" fire-and-forget que procesa solo pendientes; el cron diario cubre recordatorios de 24 h y rezagados |
| Envío de correos | — | ✅ Implementado vía Resend (se activa al configurar `RESEND_API_KEY`); plantillas HTML con fecha en la zona horaria del negocio |
| Cargas del panel | — | ✅ Snapshot por negocio con consultas paralelas; adecuado hasta miles de citas por negocio. Deuda: paginar citas históricas cuando un tenant supere ~5.000 citas. |

## 5. Mantenibilidad y DevOps

| Hallazgo | Severidad | Estado |
|---|---|---|
| Separación de capas: dominio en `src/lib` (motor de disponibilidad puro, store con interfaz única, acceso a datos en `cloud.ts`), presentación en `components/` y rutas delgadas | — | ✅ Razonable para el tamaño actual |
| **Sin manejo global de excepciones**: un error no controlado dejaba pantalla en blanco | Alta | ✅ Corregido: `error.tsx`, `global-error.tsx` y `not-found.tsx` con punto único de logging |
| **Sin CI**: se podía subir código roto a `main` (y Vercel desplegarlo) | Alta | ✅ Corregido: GitHub Actions — tipos + build de producción en cada push y PR |
| Sin health check para monitoreo | Media | ✅ `/api/health` (conectar a UptimeRobot/BetterStack) |
| Monitoreo de errores en producción (Sentry o similar) | Media | ⚠️ Pendiente: los boundaries ya centralizan el punto de captura; conectar Sentry es 1 paso cuando haya tráfico real |
| Tests automatizados | Media | ⚠️ Pendiente: el candidato #1 es el motor de disponibilidad (`availability.ts`, función pura, fácil de testear) |

---

## Deuda técnica reconocida (ordenada por prioridad)

1. Reactivar confirmación de email al activar Resend.
2. Tests unitarios del motor de disponibilidad y del flujo de reserva.
3. Motor de disponibilidad renderizando en la zona horaria del negocio.
4. Sentry (o similar) conectado a los error boundaries.
5. Paginación de citas históricas en el snapshot del panel.
6. Segundo factor (TOTP) opcional para dueños de negocio.
