# Azenda

Plataforma de agenda y reservas online para negocios de servicios — competidora
de AgendaPro / Fresha / Booksy, estandarizada por rubro.

El estudio de mercado que fundamenta el producto está en
[docs/ESTUDIO-DE-MERCADO.md](docs/ESTUDIO-DE-MERCADO.md).

## Correr la demo

```bash
npm install
npm run dev
```

| Superficie | URL | Qué es |
|---|---|---|
| Sitio de marketing | `http://localhost:3000/` | Landing con propuesta de valor, rubros y precios |
| Mini-sitio de reservas | `http://localhost:3000/aura-estudio` | Lo que ve el cliente final: flujo de reserva en 5 pasos |
| Panel administrativo | `http://localhost:3000/app` | Lo que ve el negocio: agenda, clientes, servicios, equipo, finanzas, configuración |

En la agenda del panel se pueden crear citas manualmente con el botón
**+ Nueva cita** o tocando directamente una celda vacía del calendario
(prellenar profesional y hora), con re-validación anti-sobrecupo al guardar.
La sección **Finanzas** muestra ingresos por día, proyección de la semana,
desglose por profesional/servicio, pérdidas por inasistencias y un filtro
por día/semana/mes; se actualiza al marcar citas como completadas y cobradas.

El panel es completamente administrable y todo se refleja al instante en la
página del cliente: **Equipo** permite agregar/quitar profesionales (con sus
turnos y servicios) y bloquear horarios puntuales; **Servicios** permite
agregar/quitar servicios — la agenda y las horas online se adaptan a la
duración y buffers definidos; **Configuración** edita los datos del negocio
y las políticas de reserva (anticipación, ventana, cancelación, grilla).
Quitar profesionales o servicios los desactiva en vez de borrarlos, para
preservar el historial de citas y las finanzas.

La demo usa un negocio de ejemplo ("Aura Estudio", peluquería y estética) con
datos que viven en `localStorage`: una reserva hecha en el mini-sitio aparece
al instante en la agenda del panel. En **Configuración → Restablecer demo** se
vuelve al estado inicial.

## Arquitectura

- **Next.js 15 (App Router) + Tailwind 4** — las tres superficies en un solo proyecto.
- **`src/lib/availability.ts`** — motor de disponibilidad: los horarios libres
  se calculan en tiempo real (turnos − citas con buffers − bloqueos −
  políticas del negocio), nunca se almacenan.
- **`src/lib/store.ts`** — capa de datos demo (localStorage). Es la única pieza
  que se reemplaza al conectar Supabase; los tipos de `src/lib/types.ts` son
  espejo del esquema SQL.
- **`supabase/migrations/0001_schema.sql`** — esquema completo listo para
  aplicar: multi-tenant con `business_id` + Row Level Security, y la función
  `book_appointment()` (security definer, con advisory locks) que hace la
  reserva transaccional anti doble-booking.

## Conectar Supabase (siguiente paso)

1. Crear proyecto en supabase.com y aplicar `supabase/migrations/0001_schema.sql`.
2. `npm install @supabase/supabase-js` y agregar `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.local`.
3. Reimplementar las funciones de `src/lib/store.ts` sobre el cliente de
   Supabase (misma interfaz); el mini-sitio reserva llamando `rpc('book_appointment', …)`.
4. Auth de Supabase para el login del panel (tabla `memberships` ya define roles).

## Diseño

Dirección deliberadamente no-genérica: base neutra cálida (`#faf9f6`), un solo
acento verde salvia (`#3f5c4b`), serif editorial (Fraunces) para títulos, Inter
para UI, bordes hairline en lugar de sombras. Tokens en `src/app/globals.css`.
