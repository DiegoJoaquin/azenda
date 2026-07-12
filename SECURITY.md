# Seguridad de Azenda

Modelo de seguridad de la plataforma y checklist operativo. Última auditoría:
julio 2026 (migración `0003_security.sql`).

## Modelo de amenazas cubierto

| Amenaza | Defensa |
|---|---|
| Dueño se activa solo sin pagar (`UPDATE plan_status`) | Grants por columna: `plan_status`, `trial_ends_at`, `slug` e `id` no son modificables con la anon key, ni siquiera autenticado. Solo `service_role` (dashboard) puede activarlos. |
| Leer/escribir datos de otro negocio (cross-tenant) | Row Level Security en todas las tablas con `business_id` + `is_member()`. Los clientes y citas de un negocio jamás salen de él. |
| Inyectar servicio/profesional de otro negocio en una reserva | `book_appointment` valida tenancy de cada ítem + trigger de integridad `trg_item_integrity` en `appointment_items`. |
| Reservar en negocios suspendidos o con prueba vencida | `book_appointment` rechaza con `BOOKING_PAUSED`; el mini-sitio además lo muestra pausado. |
| Cuenta vencida sigue operando por API directa | Las escrituras de miembros exigen `is_active_member()` (cuenta al día). La lectura se mantiene: sus datos nunca se secuestran. |
| Reservas falsas / spam | `book_appointment`: máx. 3 citas futuras activas por cliente por negocio, máx. 20 reservas online por negocio cada 10 min, máx. 6 servicios por reserva, validación de formato de email y largos de texto. |
| Reservar fuera de horario o sin anticipación | Validación server-side de turnos (en la zona horaria del negocio), anticipación mínima y ventana máxima. |
| Doble reserva (race condition) | `pg_advisory_xact_lock` por profesional + verificación de solapamiento (citas con buffers **y** bloqueos) dentro de la transacción. |
| Registro masivo de negocios / slugs maliciosos | `create_business`: 1 negocio por cuenta, slugs reservados (`app`, `login`, `admin`…), límites de largo, regex de slug a nivel de constraint. |
| Exponer la agenda ajena al público | El mini-sitio solo ve `get_busy_intervals`: intervalos ocupados sin nombres ni datos (y con tope de rango de 120 días). Los datos de clientes requieren membresía. |
| XSS | React escapa todo por defecto; **cero** `dangerouslySetInnerHTML`/`eval` en el código; CSP estricta como segunda barrera. |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY`. |
| Scripts/conexiones de terceros | CSP: solo `'self'` y el dominio de Supabase en `connect-src`; `object-src 'none'`, `form-action 'self'`. |
| Downgrade a HTTP | `Strict-Transport-Security` (2 años). |
| Fuga de la clave privada | La `service_role` key **no existe** en el código ni en variables del frontend; solo la anon key (pública por diseño, limitada por RLS). `.env.local` está en `.gitignore`. |
| Escalada de privilegios vía funciones SQL | Todas las funciones `security definer` fijan `search_path = public` y tienen `EXECUTE` revocado a `public`, concedido solo al rol mínimo necesario. |

## Checklist operativo (dashboard de Supabase)

- [ ] **Ejecutar `supabase/migrations/0003_security.sql`** en el SQL Editor.
- [ ] Authentication → Sign In / Providers → **Minimum password length: 8+**.
- [ ] Authentication → Sign In / Providers → activar **Leaked password protection**
      si tu plan lo incluye (rechaza contraseñas filtradas en brechas conocidas).
- [ ] Cuando actives los correos con Resend: **reactivar "Confirm email"**
      (hoy está desactivado para reducir fricción; sin verificación, alguien
      puede registrarse con un correo ajeno).
- [ ] Database → Backups: verificar que los respaldos diarios estén activos.
- [ ] Nunca pegar la **service_role key** en el código, el chat o el frontend.

## Reglas para el desarrollo futuro

1. Toda tabla nueva lleva `business_id` + RLS con `is_member`/`is_active_member`
   desde el día uno. Sin excepciones.
2. Todo lo que pueda escribir un **anónimo** pasa por una función
   `security definer` con validación y límites — nunca INSERT directo.
3. Los datos de clientes finales (nombre, email, teléfono, notas) jamás se
   exponen a lecturas anónimas; la disponibilidad pública se sirve anonimizada.
4. Secretos solo en variables de entorno del servidor (Vercel), nunca con
   prefijo `NEXT_PUBLIC_` salvo la anon key de Supabase.
