"use client";

// Mini-sitio público de reservas: la página que ve el cliente final.
// Flujo estándar de la industria en 5 pasos:
// negocio → servicios → profesional → fecha y hora → confirmación.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDB, submitBooking } from "@/lib/store";
import {
  getAvailableSlots,
  type BookingSelection,
  type SlotOption,
} from "@/lib/availability";
import {
  addDays,
  fmtCLP,
  fmtDayLong,
  fmtDayShort,
  fmtDuration,
  fmtTime,
  sameDay,
} from "@/lib/dates";
import { isBusinessLocked, type Appointment, type DB } from "@/lib/types";

const DAY_NAMES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

// Horario de atención derivado de los turnos reales del equipo activo
function scheduleLabel(db: DB): string {
  const activeIds = new Set(db.staff.filter((s) => s.active).map((s) => s.id));
  const scheds = db.schedules.filter((s) => activeIds.has(s.staffId));
  if (scheds.length === 0) return "Horario no publicado";
  const weekdays = [...new Set(scheds.map((s) => s.weekday))].sort();
  const earliest = scheds.map((s) => s.start).sort()[0];
  const first = DAY_NAMES[weekdays[0]];
  const last = DAY_NAMES[weekdays[weekdays.length - 1]];
  const range = first === last ? first : `${first} a ${last}`;
  return `${range.charAt(0).toUpperCase()}${range.slice(1)}, desde las ${earliest}`;
}

type Step = "inicio" | "servicios" | "profesional" | "horario" | "confirmar" | "listo";

const STEPS: { key: Step; label: string }[] = [
  { key: "servicios", label: "Servicios" },
  { key: "profesional", label: "Profesional" },
  { key: "horario", label: "Fecha y hora" },
  { key: "confirmar", label: "Confirmar" },
];

export default function BookingSite({ slug }: { slug: string }) {
  const db = useDB();
  const [step, setStep] = useState<Step>("inicio");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [staffChoice, setStaffChoice] = useState<Record<string, string | null>>({});
  const [day, setDay] = useState<Date>(() => new Date());
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const biz = db.business;

  const selections: BookingSelection[] = useMemo(
    () =>
      selectedServices.map((serviceId) => ({
        serviceId,
        staffId: staffChoice[serviceId] ?? null,
      })),
    [selectedServices, staffChoice]
  );

  const slots = useMemo(
    () => (step === "horario" ? getAvailableSlots(db, day, selections) : []),
    [db, day, selections, step]
  );

  if (biz.slug !== slug) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="font-serif text-3xl">Negocio no encontrado</p>
          <p className="mt-2 text-ink-soft">
            En esta demo el negocio disponible es{" "}
            <Link href="/aura-estudio" className="text-sage underline">
              /aura-estudio
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Negocio suspendido o con prueba vencida: reservas online pausadas
  if (isBusinessLocked(biz) || !biz.onlineBookingEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-serif text-3xl">{biz.name}</p>
          <p className="mt-4 text-ink-soft">
            Las reservas online están temporalmente desactivadas.
          </p>
          {biz.phone && (
            <p className="mt-2 text-sm text-ink-faint">
              Puedes agendar directamente al {biz.phone}.
            </p>
          )}
        </div>
      </div>
    );
  }

  const totalPrice = selectedServices.reduce(
    (sum, id) => sum + (db.services.find((s) => s.id === id)?.priceClp ?? 0),
    0
  );
  const totalMin = selectedServices.reduce(
    (sum, id) => sum + (db.services.find((s) => s.id === id)?.durationMin ?? 0),
    0
  );

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSlot(null);
  }

  async function confirmBooking() {
    if (!slot || submitting) return;
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Completa tu nombre, correo y teléfono para confirmar.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setError("El correo no parece válido. Revísalo, por favor.");
      return;
    }
    // Re-validación local del slot; la validación definitiva la hace el
    // servidor (RPC transaccional) en modo real.
    const fresh = getAvailableSlots(db, day, selections).find(
      (s) => s.start.getTime() === slot.start.getTime()
    );
    if (!fresh) {
      setError("Ese horario acaba de ser tomado. Elige otro, por favor.");
      setStep("horario");
      setSlot(null);
      return;
    }
    setSubmitting(true);
    const result = await submitBooking({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      note: form.note.trim(),
      items: fresh.assignment.map((a) => ({
        serviceId: a.serviceId,
        staffId: a.staffId,
        startsAt: a.startsAt,
      })),
    });
    setSubmitting(false);
    if (!result.ok) {
      if (result.error === "SLOT_TAKEN") {
        setError("Ese horario acaba de ser tomado. Elige otro, por favor.");
        setStep("horario");
        setSlot(null);
      } else if (result.error === "LIMIT") {
        setError(
          "Ya tienes el máximo de reservas activas en este negocio. Si necesitas cambiar una, contáctalos directamente."
        );
      } else if (result.error === "PAUSED") {
        setError("Las reservas online de este negocio están pausadas en este momento.");
      } else {
        setError("No pudimos completar la reserva. Inténtalo de nuevo en unos segundos.");
      }
      return;
    }
    setConfirmed(result.appt);
    setStep("listo");
    setError("");
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen">
      {/* Barra del negocio */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {biz.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={biz.logoUrl}
                alt={biz.name}
                className="h-9 w-9 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage font-serif text-sm text-white">
                {biz.name.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium leading-tight">{biz.name}</p>
              <p className="text-xs text-ink-faint">{biz.address.split(",")[1]}</p>
            </div>
          </div>
          <span className="text-xs text-ink-faint">
            con <span className="font-serif">Azenda</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        {/* Indicador de pasos */}
        {step !== "inicio" && step !== "listo" && (
          <nav className="flex items-center gap-2 pt-8 text-xs">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-6 bg-line-strong" />}
                <span
                  className={
                    i === stepIndex
                      ? "font-medium text-ink"
                      : i < stepIndex
                        ? "text-sage"
                        : "text-ink-faint"
                  }
                >
                  {i < stepIndex ? "✓ " : ""}
                  {s.label}
                </span>
              </div>
            ))}
          </nav>
        )}

        {/* ---------- Paso 0: landing del negocio ---------- */}
        {step === "inicio" && (
          <div className="pt-16">
            {biz.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={biz.logoUrl}
                alt={biz.name}
                className="mb-6 h-20 w-20 rounded-2xl border border-line object-cover shadow-sm"
              />
            )}
            <p className="text-sm uppercase tracking-[0.2em] text-sage">
              Reserva online
            </p>
            <h1 className="mt-4 font-serif text-5xl tracking-tight">{biz.name}</h1>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-soft">
              {biz.description}
            </p>
            <dl className="mt-8 space-y-2 text-sm text-ink-soft">
              <div className="flex gap-3">
                <dt className="w-20 text-ink-faint">Dirección</dt>
                <dd>{biz.address}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 text-ink-faint">Teléfono</dt>
                <dd>{biz.phone}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 text-ink-faint">Horario</dt>
                <dd>{scheduleLabel(db)}</dd>
              </div>
            </dl>
            <button
              onClick={() => setStep("servicios")}
              className="mt-10 rounded-md bg-ink px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Reservar una hora
            </button>
            <p className="mt-4 text-xs text-ink-faint">
              Cancelación gratuita hasta {biz.cancellationHours} horas antes.
            </p>
          </div>
        )}

        {/* ---------- Paso 1: servicios ---------- */}
        {step === "servicios" && (
          <div className="pt-10">
            <h2 className="font-serif text-3xl tracking-tight">
              ¿Qué te vas a hacer?
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Puedes elegir más de un servicio; se agendan seguidos.
            </p>
            <div className="mt-8 space-y-10">
              {db.categories.map((cat) => {
                const svcs = db.services.filter(
                  (s) => s.categoryId === cat.id && s.visibleOnline && s.active
                );
                if (svcs.length === 0) return null;
                return (
                  <section key={cat.id}>
                    <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-ink-faint">
                      {cat.name}
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-line bg-surface">
                      {svcs.map((s, i) => {
                        const active = selectedServices.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleService(s.id)}
                            className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
                              i > 0 ? "border-t border-line" : ""
                            } ${active ? "bg-sage-tint" : "hover:bg-paper"}`}
                          >
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="mt-0.5 text-sm text-ink-faint">
                                {fmtDuration(s.durationMin)} · {s.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm">{fmtCLP(s.priceClp)}</span>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                                  active
                                    ? "border-sage bg-sage text-white"
                                    : "border-line-strong text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- Paso 2: profesional ---------- */}
        {step === "profesional" && (
          <div className="pt-10">
            <h2 className="font-serif text-3xl tracking-tight">
              ¿Con quién prefieres?
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Si no tienes preferencia, asignamos al primer profesional disponible.
            </p>
            <div className="mt-8 space-y-8">
              {selectedServices.map((svcId) => {
                const svc = db.services.find((s) => s.id === svcId)!;
                const eligible = db.staff.filter(
                  (st) =>
                    st.active &&
                    st.bookableOnline &&
                    db.staffServices.some(
                      (ss) => ss.staffId === st.id && ss.serviceId === svcId
                    )
                );
                const chosen = staffChoice[svcId] ?? null;
                return (
                  <section key={svcId}>
                    <h3 className="mb-3 text-sm font-medium">{svc.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        active={chosen === null}
                        onClick={() =>
                          setStaffChoice((p) => ({ ...p, [svcId]: null }))
                        }
                        label="Cualquier profesional"
                        sub="primera hora libre"
                      />
                      {eligible.map((st) => (
                        <Chip
                          key={st.id}
                          active={chosen === st.id}
                          onClick={() =>
                            setStaffChoice((p) => ({ ...p, [svcId]: st.id }))
                          }
                          label={st.name}
                          sub={st.title}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- Paso 3: fecha y hora ---------- */}
        {step === "horario" && (
          <div className="pt-10">
            <h2 className="font-serif text-3xl tracking-tight">Elige fecha y hora</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Duración total: {fmtDuration(totalMin)} · Disponibilidad en tiempo real.
            </p>
            {typeof Intl !== "undefined" &&
              Intl.DateTimeFormat().resolvedOptions().timeZone !== biz.timezone && (
                <p className="mt-3 rounded-md bg-info-tint px-4 py-2.5 text-sm text-info">
                  Estás en una zona horaria distinta a la del negocio (
                  {biz.timezone}); verifica la hora antes de confirmar.
                </p>
              )}

            {/* Selector de día: próximos 14 días */}
            <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map(
                (d) => {
                  const active = sameDay(d, day);
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => {
                        setDay(d);
                        setSlot(null);
                      }}
                      className={`min-w-[72px] rounded-md border px-3 py-2.5 text-center transition-colors ${
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-surface hover:border-line-strong"
                      }`}
                    >
                      <p className="text-[11px] uppercase tracking-wide opacity-70">
                        {fmtDayShort(d).split(" ")[0]}
                      </p>
                      <p className="mt-0.5 font-serif text-lg leading-none">
                        {d.getDate()}
                      </p>
                    </button>
                  );
                }
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-6">
              {slots.length === 0 ? (
                <p className="rounded-md border border-line bg-surface px-5 py-8 text-center text-sm text-ink-faint">
                  No hay horas disponibles el {fmtDayLong(day)}.
                  <br />
                  Prueba con otro día — atendemos de martes a sábado.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slots.map((s) => {
                    const active =
                      slot && s.start.getTime() === slot.start.getTime();
                    return (
                      <button
                        key={s.start.toISOString()}
                        onClick={() => setSlot(s)}
                        className={`rounded-md border py-2.5 text-sm transition-colors ${
                          active
                            ? "border-sage bg-sage text-white"
                            : "border-line bg-surface hover:border-sage"
                        }`}
                      >
                        {fmtTime(s.start)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- Paso 4: confirmar ---------- */}
        {step === "confirmar" && slot && (
          <div className="pt-10">
            <h2 className="font-serif text-3xl tracking-tight">Revisa y confirma</h2>
            <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
              <div className="border-b border-line bg-paper px-5 py-3 text-sm text-ink-soft">
                {fmtDayLong(day)} · {fmtTime(slot.start)} hrs
              </div>
              {slot.assignment.map((a) => {
                const svc = db.services.find((s) => s.id === a.serviceId)!;
                const st = db.staff.find((x) => x.id === a.staffId)!;
                return (
                  <div
                    key={a.serviceId + a.startsAt.toISOString()}
                    className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{svc.name}</p>
                      <p className="text-sm text-ink-faint">
                        {fmtTime(a.startsAt)} · {fmtDuration(svc.durationMin)} · con{" "}
                        {st.name}
                      </p>
                    </div>
                    <span className="text-sm">{fmtCLP(svc.priceClp)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between bg-paper px-5 py-4">
                <span className="text-sm font-medium">Total a pagar en el local</span>
                <span className="font-serif text-xl">{fmtCLP(totalPrice)}</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre y apellido"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Ej: Josefina Pérez"
              />
              <Field
                label="Teléfono"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+56 9 …"
              />
              <div className="sm:col-span-2">
                <Field
                  label="Correo"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  placeholder="tu@correo.cl"
                  type="email"
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Nota para el equipo (opcional)"
                  value={form.note}
                  onChange={(v) => setForm((f) => ({ ...f, note: v }))}
                  placeholder="Alergias, referencias, etc."
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <p className="mt-6 text-xs leading-relaxed text-ink-faint">
              Al confirmar aceptas la política de cancelación de {biz.name}:
              puedes cancelar o reagendar sin costo hasta {biz.cancellationHours}{" "}
              horas antes de tu cita.
            </p>
          </div>
        )}

        {/* ---------- Éxito ---------- */}
        {step === "listo" && confirmed && (
          <div className="pt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-2xl text-white">
              ✓
            </div>
            <h2 className="mt-6 font-serif text-4xl tracking-tight">
              ¡Hora reservada!
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-ink-soft">
              Te esperamos el{" "}
              <strong className="text-ink">
                {fmtDayLong(new Date(confirmed.startsAt))}
              </strong>{" "}
              a las{" "}
              <strong className="text-ink">
                {fmtTime(new Date(confirmed.startsAt))} hrs
              </strong>
              . Enviamos la confirmación a {form.email}.
            </p>
            <div className="mx-auto mt-8 max-w-sm rounded-lg border border-line bg-surface px-6 py-5 text-left text-sm">
              {confirmed.items.map((it) => {
                const svc = db.services.find((s) => s.id === it.serviceId)!;
                const st = db.staff.find((x) => x.id === it.staffId)!;
                return (
                  <p key={it.serviceId + it.startsAt} className="py-1">
                    <span className="font-medium">{svc.name}</span>{" "}
                    <span className="text-ink-faint">
                      — {fmtTime(new Date(it.startsAt))} con {st.name}
                    </span>
                  </p>
                );
              })}
              <p className="mt-3 border-t border-line pt-3 text-ink-faint">
                Total: {fmtCLP(confirmed.totalClp)} · Pago en el local
              </p>
            </div>
            <div className="mt-10 flex justify-center gap-4 text-sm">
              <button
                onClick={() => {
                  setStep("inicio");
                  setSelectedServices([]);
                  setStaffChoice({});
                  setSlot(null);
                  setConfirmed(null);
                  setForm({ name: "", email: "", phone: "", note: "" });
                }}
                className="rounded-md border border-line-strong px-5 py-2.5 transition-colors hover:border-ink"
              >
                Hacer otra reserva
              </button>
              <Link
                href="/app"
                className="rounded-md bg-ink px-5 py-2.5 text-white transition-colors hover:bg-black"
              >
                Ver la agenda del negocio →
              </Link>
            </div>
          </div>
        )}

        {/* Barra inferior de navegación del flujo */}
        {step !== "inicio" && step !== "listo" && (
          <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
              <button
                onClick={() => {
                  const order: Step[] = ["servicios", "profesional", "horario", "confirmar"];
                  const i = order.indexOf(step);
                  setStep(i <= 0 ? "inicio" : order[i - 1]);
                  setError("");
                }}
                className="text-sm text-ink-soft hover:text-ink"
              >
                ← Volver
              </button>
              <div className="flex items-center gap-5">
                {selectedServices.length > 0 && (
                  <span className="hidden text-sm text-ink-faint sm:block">
                    {selectedServices.length}{" "}
                    {selectedServices.length === 1 ? "servicio" : "servicios"} ·{" "}
                    {fmtDuration(totalMin)} · {fmtCLP(totalPrice)}
                  </span>
                )}
                {step === "confirmar" ? (
                  <button
                    onClick={confirmBooking}
                    disabled={submitting}
                    className="rounded-md bg-sage px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-60"
                  >
                    {submitting ? "Confirmando…" : "Confirmar reserva"}
                  </button>
                ) : (
                  <button
                    disabled={
                      (step === "servicios" && selectedServices.length === 0) ||
                      (step === "horario" && !slot)
                    }
                    onClick={() => {
                      const order: Step[] = ["servicios", "profesional", "horario", "confirmar"];
                      setStep(order[order.indexOf(step) + 1]);
                    }}
                    className="rounded-md bg-ink px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Continuar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-4 py-2.5 text-left transition-colors ${
        active
          ? "border-sage bg-sage-tint"
          : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-ink-faint">{sub}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-faint/60 focus:border-sage"
      />
    </label>
  );
}
