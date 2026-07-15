import Link from "next/link";
import { emailLink, TRIAL_DAYS } from "@/lib/config";

const FEATURES = [
  {
    title: "Agenda por profesional",
    body: "Calendario semanal con estados por color, bloqueos y reagendamiento. Tu equipo completo en una sola vista.",
  },
  {
    title: "Reservas online 24/7",
    body: "Cada negocio tiene su propia página de reservas. Tus clientes eligen servicio, profesional y hora sin llamarte.",
  },
  {
    title: "Disponibilidad real",
    body: "Los horarios se calculan al momento: turnos, citas, buffers y bloqueos. Nunca más una doble reserva.",
  },
  {
    title: "Ficha de clientes",
    body: "Historial de visitas, notas y preferencias. La ficha se adapta a tu rubro: técnica, clínica o de sesiones.",
  },
  {
    title: "Recordatorios automáticos",
    body: "Confirmaciones y recordatorios por correo y WhatsApp que reducen las inasistencias hasta un 70%.",
  },
  {
    title: "Protección de agenda",
    body: "Anticipos al reservar, políticas de cancelación y registro de inasistencias por cliente.",
  },
];

const VERTICALS = [
  { name: "Peluquerías", detail: "Color, corte y tiempos de proceso" },
  { name: "Barberías", detail: "Turnos rápidos y clientes frecuentes" },
  { name: "Spa y estética", detail: "Cabinas, salas y tratamientos" },
  { name: "Clínicas y salud", detail: "Ficha clínica y aprobación previa" },
  { name: "Psicología", detail: "Sesiones, paquetes y videollamada" },
  { name: "Fitness", detail: "Clases con cupos y lista de espera" },
];

const PLANS = [
  {
    name: "Individual",
    price: "$9.900",
    period: "por mes",
    features: [
      "1 profesional",
      "Agenda y reservas online",
      "Citas ilimitadas",
      "Clientes y finanzas",
    ],
    cta: `Prueba gratis por ${TRIAL_DAYS} días`,
    href: "/registro",
    highlight: false,
  },
  {
    name: "Estudio",
    price: "$19.900",
    period: "por mes",
    features: [
      "Hasta 8 profesionales",
      "Citas ilimitadas",
      "Bloqueos y turnos por persona",
      "Reportes de ingresos y ocupación",
      "Soporte por WhatsApp",
    ],
    cta: `Prueba gratis por ${TRIAL_DAYS} días`,
    href: "/registro",
    highlight: true,
  },
  {
    name: "Empresa",
    price: "$49.900",
    period: "por mes",
    features: [
      "Profesionales ilimitados",
      "Multi-sucursal (próximamente)",
      "Permisos por rol",
      "Soporte prioritario",
    ],
    cta: "Escríbenos",
    href: emailLink(
      "Plan Empresa — Buuki",
      "Hola, me interesa el plan Empresa de Buuki."
    ),
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-serif text-xl tracking-tight">Buuki</span>
          <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
            <a href="#funcionalidades" className="hover:text-ink">Funcionalidades</a>
            <a href="#rubros" className="hover:text-ink">Rubros</a>
            <a href="#precios" className="hover:text-ink">Precios</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-sm text-ink-soft hover:text-ink sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="rounded-md bg-sage px-4 py-2 text-sm text-white transition-colors hover:bg-sage-deep"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <div className="max-w-3xl">
          <p className="mb-6 text-sm uppercase tracking-[0.2em] text-sage">
            Agenda y reservas para negocios de servicios
          </p>
          <h1 className="font-serif text-5xl leading-[1.08] tracking-tight md:text-6xl">
            Tu agenda ordenada.
            <br />
            Tus horas, reservadas solas.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Buuki le da a tu negocio una página de reservas propia y un panel
            que ordena agenda, clientes y equipo — adaptado a tu rubro desde el
            primer día.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/registro"
              className="rounded-md bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Crea tu cuenta — {TRIAL_DAYS} días gratis
            </Link>
            <Link
              href="/demo"
              className="rounded-md border border-line-strong px-6 py-3 text-sm font-medium transition-colors hover:border-ink"
            >
              Probar la demo
            </Link>
            <Link
              href="/aura-estudio"
              className="text-sm text-ink-soft underline-offset-4 hover:underline"
            >
              Reservar como cliente →
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {[
            ["24/7", "reservas sin llamadas"],
            ["−70%", "de inasistencias"],
            ["5 pasos", "para reservar una hora"],
            ["1 panel", "para todo el negocio"],
          ].map(([n, t]) => (
            <div key={t} className="bg-surface px-6 py-8">
              <p className="font-serif text-3xl">{n}</p>
              <p className="mt-1 text-sm text-ink-faint">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Todo lo que un negocio de horas necesita
          </h2>
          <p className="mt-3 max-w-xl text-ink-soft">
            Sin módulos de relleno: las herramientas que usas todos los días,
            hechas con cuidado.
          </p>
          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-t border-line pt-5">
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rubros */}
      <section id="rubros" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
                Estandarizado para tu rubro
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                Al crear tu cuenta eliges tu rubro y Buuki se configura sola:
                servicios típicos precargados, ficha de cliente adecuada y las
                funciones que tu industria usa de verdad.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              {VERTICALS.map((v) => (
                <div
                  key={v.name}
                  className="group bg-paper px-6 py-6 transition-colors hover:bg-sage-tint"
                >
                  <p className="font-medium">{v.name}</p>
                  <p className="mt-1 text-sm text-ink-faint">{v.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-serif text-3xl tracking-tight md:text-4xl">
            Precios simples, sin sorpresas
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-ink-soft">
            Empieza gratis y crece cuando tu agenda crezca.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-lg border p-8 ${
                  p.highlight
                    ? "border-sage bg-sage-tint/60"
                    : "border-line bg-paper"
                }`}
              >
                <p className="text-sm uppercase tracking-widest text-ink-faint">
                  {p.name}
                </p>
                <p className="mt-4 font-serif text-4xl">{p.price}</p>
                <p className="text-sm text-ink-faint">{p.period}</p>
                <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-sage">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`mt-8 block rounded-md py-2.5 text-center text-sm font-medium transition-colors ${
                    p.highlight
                      ? "bg-sage text-white hover:bg-sage-deep"
                      : "border border-line-strong hover:border-ink"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-lg text-center text-sm text-ink-faint">
            Todos los planes parten con {TRIAL_DAYS} días de prueba, sin
            tarjeta. El pago es mensual por transferencia bancaria — nos
            escribes, transfieres y tu cuenta queda activa el mismo día.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center">
          <div>
            <span className="font-serif text-lg">Buuki</span>
            <p className="mt-1 text-sm text-ink-faint">
              Agenda online para negocios de servicios.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-faint">
            <Link href="/terminos" className="hover:text-ink">
              Términos y Condiciones
            </Link>
            <Link href="/privacidad" className="hover:text-ink">
              Política de Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
