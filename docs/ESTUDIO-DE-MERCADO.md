# Estudio de mercado — Plataformas de reservas y agendamiento

> Investigación base para construir una plataforma competidora de AgendaPro, Fresha, Booksy, Reservo y similares.
> Fecha: julio 2026. Este documento es el plano maestro del producto.

---

## 1. Panorama competitivo

| Plataforma | Origen/foco | Modelo de precio | Fortaleza clave | Debilidad explotable |
|---|---|---|---|---|
| **AgendaPro** | LATAM (Chile), belleza/salud/bienestar | Planes desde ~USD 19/mes (individual), ~USD 29/mes (hasta 20 usuarios), ~USD 149/mes (equipos grandes). Sin plan gratis. | Todo-en-uno: agenda + POS + inventario + marketing + IA ("Sofía" agenda, "Julia" ventas). 20.000+ negocios, 20+ países. | UI recargada, precio sube constantemente, sin plan gratuito |
| **Fresha** | Global, salones/spas | Sin mensualidad; cobra 20% de comisión por cliente nuevo del marketplace (mín. USD 6) + 2.19% + $0.20 por transacción de tarjeta | Sistema de gestión primero; lógica de citas multi-paso (un booking abarca varios profesionales, salas y secuencias de tratamiento) | Comisiones altas por cliente nuevo; el negocio no controla el canal |
| **Booksy** | Global, barberías/salones | ~USD 29.99/mes + ~USD 20/mes por staff extra; Unlimited USD 119.99/mes | Marketplace de consumidores con 35M+ usuarios; discovery de clientes; lealtad y protección contra no-shows | Caro al escalar equipo |
| **Reservo** | Chile, clínicas/dental | Desde USD 30/mes (1 profesional), USD 50/mes (3), extra por especialista | Ficha clínica electrónica personalizable (odontograma, ficha facial), telemedicina certificada Fonasa/CENS, agenda con códigos de color por estado | Solo agenda: no cubre POS, inventario ni marketing |
| **SimplyBook.me** | Global, multi-rubro | Freemium por número de reservas y "custom features" | Plantillas por industria (belleza, médico, fitness, educación, servicios personales), 15+ temas visuales, intake forms por rubro | Genérico, menos profundo por vertical |
| **Calendly** | Global, reuniones B2B | Freemium por asiento | Simplicidad extrema del flujo de reserva 1:1 | No sirve para negocios con local, staff, servicios y pagos |

**Conclusión estratégica:** el espacio ganador es el de AgendaPro (suite todo-en-uno para negocios de servicios en español) pero con: (a) plan gratuito real de entrada, (b) UI limpia y elegante en vez de recargada, (c) estandarización por rubro tipo SimplyBook (plantillas verticales), y (d) la lógica de disponibilidad robusta de Fresha.

---

## 2. Anatomía de estas plataformas (las 4 superficies)

Todas las plataformas analizadas se componen de **cuatro superficies** distintas:

### 2.1 Sitio de marketing (público)
- Hero con propuesta de valor + CTA "Crea tu cuenta gratis" repetido en toda la página.
- Cifras de confianza (negocios, profesionales, citas agendadas).
- Navegación: Funcionalidades · Industrias/Rubros · Precios · Recursos · Login/Registro.
- Páginas por vertical (peluquerías, spas, clínicas, psicólogos, barberías, fitness…) con copy adaptado al rubro — clave para SEO.
- Página de precios con 3 planes y toggle mensual/anual (descuento anual).

### 2.2 Panel administrativo (el negocio) — el corazón del producto
Módulos estándar del rubro, en orden de importancia:

1. **Agenda / Calendario** — vista día/semana/mes, columnas por profesional, código de colores por estado de cita, drag & drop para reagendar, bloqueo de horarios, citas recurrentes, citas grupales.
2. **Reservas online** — configuración del mini-sitio: servicios visibles, ventana de reserva (mín/máx anticipación), aprobación manual u automática, políticas de cancelación.
3. **Clientes (CRM)** — ficha con historial de citas, notas, ficha clínica/técnica según rubro, etiquetas, cumpleaños, historial de pagos.
4. **Servicios** — catálogo con duración, precio, buffer antes/después, profesionales habilitados, categorías, servicios en secuencia (multi-paso), add-ons.
5. **Equipo/Profesionales** — horarios de trabajo (shifts), servicios que realiza cada uno, comisiones, permisos por rol.
6. **Pagos y caja (POS)** — cobro en local, pago online al reservar, anticipos/abonos para proteger contra no-shows, propinas, facturación electrónica.
7. **Inventario** — productos, stock, alertas, venta de productos en checkout.
8. **Marketing** — recordatorios automáticos (WhatsApp/email/SMS), campañas de email, gift cards, programas de lealtad, códigos de descuento, paquetes/bonos de sesiones.
9. **Reportes** — ingresos, ocupación, no-shows, comisiones, rentabilidad por servicio/profesional, multi-sucursal.
10. **Configuración** — negocio, sucursales, horarios de atención, integración con Google Reserve, personalización del mini-sitio (logo, colores, fotos).

### 2.3 Mini-sitio de reservas (el cliente final)
Cada negocio obtiene una página pública (`plataforma.com/nombre-negocio`) con el **flujo estándar de la industria** (5 pasos, validado por Fresha/Booksy/AgendaPro):

1. **Landing del negocio**: logo, fotos, descripción, dirección/mapa, horarios, reseñas.
2. **Elegir servicio(s)**: catálogo por categorías con duración y precio; carrito multi-servicio.
3. **Elegir profesional**: opcional ("cualquier profesional" como default), foto + nombre; puede elegirse distinto profesional por servicio.
4. **Elegir fecha y hora**: calendario con disponibilidad en tiempo real calculada desde turnos del staff + citas existentes + buffers.
5. **Confirmar**: resumen (servicios, fecha, profesional, total), datos del cliente (o login), nota opcional, pago/anticipo si el negocio lo exige → confirmación + notificación.

Extras estándar: reagendar/cancelar desde el email/WhatsApp de confirmación, dentro de la política de cancelación del negocio.

### 2.4 Marketplace (opcional, fase futura)
Directorio público de negocios con búsqueda por rubro/ubicación. Es la fortaleza de Booksy y Fresha pero **no es necesario para el MVP** — AgendaPro creció principalmente como herramienta SaaS.

---

## 3. Lógica del sistema (lo que hay que clonar bien)

### 3.1 Motor de disponibilidad (la pieza más difícil)
La disponibilidad **no se guarda como slots en la base de datos**: se **calcula** en tiempo real:

```
disponibilidad(profesional, día) =
    turnos_de_trabajo(profesional, día)
  − citas_existentes (+ buffers de cada servicio)
  − bloqueos (vacaciones, almuerzo, bloqueos manuales)
  − restricciones del negocio (anticipación mínima/máxima, horario de sucursal)
→ discretizado en pasos de N minutos (grilla de 5/10/15 min)
→ filtrado por duración total de los servicios seleccionados
```

Reglas del rubro:
- **Buffer** antes/después por servicio (limpieza, preparación).
- **Processing gaps** (Fresha): servicios con tiempo muerto en el medio (ej. tinte: aplicar 30' → esperar 45' libre para otra cita → enjuagar 15').
- **Servicios en secuencia**: varios servicios se agendan consecutivos, incluso con distinto profesional.
- **Prevención de doble reserva**: lock transaccional al confirmar (dos clientes no pueden tomar el mismo slot).
- **Zona horaria** del negocio, no del servidor.

### 3.2 Ciclo de vida de la cita (máquina de estados)
```
pendiente (si requiere aprobación) → confirmada → [cliente llega] atendida → completada/pagada
                                   ↘ cancelada (por cliente o negocio)
                                   ↘ no_show
reagendada = cancelación + nueva cita vinculada
```
Cada estado tiene color propio en el calendario (patrón Reservo) y dispara notificaciones.

### 3.3 Notificaciones (el driver #1 de retención del SaaS)
- Confirmación inmediata (email + WhatsApp).
- Recordatorio 24h antes y 2h antes (configurable) con botón confirmar/cancelar.
- Aviso al negocio de nueva reserva/cancelación.
- Post-visita: solicitud de reseña, remarketing ("hace 30 días que no vienes").

### 3.4 Protección contra no-shows (estándar Booksy/Fresha)
- Tarjeta en archivo o anticipo (%) al reservar.
- Cargo por cancelación tardía según política configurable.
- Historial de no-shows visible en la ficha del cliente.

### 3.5 Estandarización por rubro (tu diferenciador)
Patrón SimplyBook llevado más lejos: al crear la cuenta, el negocio elige su **rubro** y la plataforma se auto-configura:

| Rubro | Servicios precargados | Ficha de cliente | Extras del vertical |
|---|---|---|---|
| Peluquería/Barbería | corte, tinte, barba… | historial técnico (fórmula de color) | processing gaps |
| Clínica/Salud | consulta, control | ficha clínica, anamnesis | aprobación manual, telemedicina |
| Psicología | sesión 50 min | notas privadas de sesión | paquetes de sesiones, videollamada |
| Spa/Estética | masajes, faciales | ficha facial | salas/recursos además de staff |
| Fitness | clases grupales | membresías | cupos por clase, lista de espera |
| Genérico | plantilla vacía | básica | — |

Internamente **es el mismo modelo de datos**; el rubro solo cambia seeds, terminología, campos de ficha y features activadas.

---

## 4. Arquitectura propuesta (preliminar, con Supabase)

- **Frontend:** Next.js (App Router) — sitio marketing + panel admin + mini-sitios públicos en un solo proyecto con rutas separadas. Mini-sitio como ruta dinámica `/{slug-negocio}`.
- **Backend:** Supabase — Postgres + Auth + Row Level Security para multi-tenancy (cada fila lleva `business_id`; RLS garantiza aislamiento por negocio). Edge Functions para lógica sensible (confirmación transaccional de reservas, webhooks de pago).
- **Multi-tenant:** una sola base con `business_id` en cada tabla + políticas RLS (patrón estándar SaaS; escala hasta decenas de miles de negocios).
- **Pagos (fase 2):** Mercado Pago / Transbank (Chile) vía Edge Functions.
- **Notificaciones (fase 2):** email transaccional (Resend) + WhatsApp Business API.

### Modelo de datos núcleo (borrador)
```
businesses        (id, slug, nombre, rubro, timezone, logo, colores, políticas)
locations         (business_id, dirección, horarios de atención)
staff             (business_id, user_id, nombre, foto, rol)
staff_schedules   (staff_id, día_semana, hora_inicio, hora_fin)   ← turnos recurrentes
schedule_overrides(staff_id, fecha, tipo: libre/extra)            ← vacaciones, excepciones
service_categories(business_id, nombre, orden)
services          (business_id, categoría, nombre, duración, precio, buffer_antes,
                   buffer_después, requiere_anticipo, visible_online)
staff_services    (staff_id, service_id)                          ← quién hace qué
clients           (business_id, nombre, email, teléfono, notas, ficha jsonb por rubro)
appointments      (business_id, location_id, client_id, fecha_hora_inicio,
                   estado, origen: online/manual, total, nota)
appointment_items (appointment_id, service_id, staff_id, hora_inicio, duración, precio)
time_blocks       (staff_id, inicio, fin, motivo)                 ← bloqueos manuales
users + memberships(user_id, business_id, rol: owner/admin/staff) ← auth multi-negocio
```

---

## 5. Dirección de diseño

Objetivo: **sutil y elegante, nada de "plantilla IA"**. Decisiones concretas:

- **Nada de**: gradientes morado-azul, glassmorphism genérico, emojis en la UI, cards con sombras enormes, hero con blobs.
- **Sí**: base neutra cálida (blancos rotos, grises piedra), **un** color de acento sobrio (verde salvia profundo o azul tinta), tipografía con carácter (una serif editorial para títulos + sans limpia para UI), espaciado generoso, bordes hairline de 1px en vez de sombras, microinteracciones discretas.
- Referencias de tono: Linear (densidad y orden), Fresha (claridad del flujo de reserva), sitios editoriales tipo Stripe Press (elegancia tipográfica).
- El mini-sitio de cada negocio hereda su logo/color pero dentro del sistema visual sobrio de la plataforma.

---

## 6. Roadmap propuesto

**MVP (fase 1):** registro de negocio con selección de rubro → onboarding auto-configurado → panel: agenda con calendario por profesional, servicios, equipo con horarios, clientes → mini-sitio público con flujo de reserva de 5 pasos → motor de disponibilidad completo (buffers, bloqueos, anti-doble-reserva) → gestión de estados de cita.

**Fase 2:** notificaciones (email/WhatsApp), pagos y anticipos, reportes, multi-sucursal.

**Fase 3:** inventario, marketing (campañas, gift cards, lealtad), marketplace/directorio, apps móviles.
