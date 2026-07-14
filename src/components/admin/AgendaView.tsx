"use client";

// Agenda del negocio: vista diaria con una columna por profesional
// (patrón estándar del rubro) y estados de cita por color.

import { useMemo, useState } from "react";
import { useDB, setAppointmentStatus } from "@/lib/store";
import { workIntervals } from "@/lib/availability";
import NewAppointmentModal, {
  type ModalPrefill,
} from "@/components/admin/NewAppointmentModal";
import DatePicker from "@/components/admin/DatePicker";
import ShareBookingDialog from "@/components/admin/ShareBookingDialog";
import {
  addDays,
  fmtCLP,
  fmtDayLong,
  fmtTime,
  parseISO,
  sameDay,
} from "@/lib/dates";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const DAY_START = 8; // 08:00
const DAY_END = 20; // 20:00
const PX_PER_MIN = 1.1;

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pendiente: "bg-clay-tint border-clay text-clay",
  confirmada: "bg-sage-tint border-sage text-sage-deep",
  atendida: "bg-info-tint border-info text-info",
  completada: "bg-paper border-line-strong text-ink-faint",
  cancelada: "bg-paper border-line text-ink-faint line-through",
  no_show: "bg-danger-tint border-danger text-danger",
};

const NEXT_ACTIONS: Partial<
  Record<AppointmentStatus, { to: AppointmentStatus; label: string }[]>
> = {
  pendiente: [
    { to: "confirmada", label: "Aprobar" },
    { to: "cancelada", label: "Rechazar" },
  ],
  confirmada: [
    { to: "atendida", label: "Cliente llegó" },
    { to: "no_show", label: "No asistió" },
    { to: "cancelada", label: "Cancelar" },
  ],
  atendida: [{ to: "completada", label: "Completar y cobrar" }],
};

export default function AgendaView() {
  const db = useDB();
  const [day, setDay] = useState(() => new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [modal, setModal] = useState<ModalPrefill | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // En pantallas chicas se puede filtrar a un solo profesional
  const [staffFilter, setStaffFilter] = useState<string>("all");

  const allStaff = useMemo(
    () => [...db.staff].filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [db.staff]
  );
  const staff = useMemo(
    () =>
      staffFilter === "all"
        ? allStaff
        : allStaff.filter((s) => s.id === staffFilter),
    [allStaff, staffFilter]
  );

  const dayAppts = useMemo(
    () =>
      db.appointments.filter((a) => sameDay(parseISO(a.startsAt), day)),
    [db.appointments, day]
  );

  const hours = Array.from(
    { length: DAY_END - DAY_START },
    (_, i) => DAY_START + i
  );
  const gridHeight = (DAY_END - DAY_START) * 60 * PX_PER_MIN;

  function minutesFromDayStart(d: Date): number {
    return (d.getHours() - DAY_START) * 60 + d.getMinutes();
  }

  // Mantener el panel de detalle sincronizado con el store
  const selectedFresh = selected
    ? db.appointments.find((a) => a.id === selected.id) ?? null
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-xl tracking-tight md:text-2xl">Agenda</h1>
          <button
            onClick={() => setShowShare(true)}
            className="hidden rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-sage hover:text-sage sm:block"
          >
            ↗ Compartir página de reservas
          </button>
        </div>
        <div className="flex items-center gap-2">
          {allStaff.length > 1 && (
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="rounded-md border border-line bg-paper px-2 py-2 text-sm outline-none focus:border-sage md:hidden"
              aria-label="Filtrar profesional"
            >
              <option value="all">Todos</option>
              {allStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name.split(" ")[0]}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setModal({})}
            className="whitespace-nowrap rounded-md bg-sage px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-deep md:mr-2 md:px-4"
          >
            + Nueva<span className="hidden sm:inline"> cita</span>
          </button>
          <button
            onClick={() => setDay((d) => addDays(d, -1))}
            className="rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-line-strong"
            aria-label="Día anterior"
          >
            ←
          </button>
          {/* Fecha clicable → abre el calendario */}
          <div className="relative">
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className="min-w-[150px] rounded-md border border-line px-3 py-2 text-sm capitalize transition-colors hover:border-sage"
            >
              {sameDay(day, new Date()) ? "Hoy · " : ""}
              {fmtDayLong(day).replace(/ de \w+$/, "")}
            </button>
            {showCalendar && (
              <DatePicker
                value={day}
                onSelect={setDay}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>
          <button
            onClick={() => setDay((d) => addDays(d, 1))}
            className="rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-line-strong"
            aria-label="Día siguiente"
          >
            →
          </button>
        </div>
      </header>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-paper px-4 py-2.5 md:px-6">
        {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((st) => (
          <span key={st} className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span
              className={`h-2.5 w-2.5 rounded-full border ${STATUS_STYLE[st].split(" ").slice(0, 2).join(" ")}`}
            />
            {STATUS_LABEL[st]}
          </span>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Grilla del calendario */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-fit">
            {/* Columna de horas */}
            <div className="w-14 shrink-0 border-r border-line">
              <div className="h-12 border-b border-line" />
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="absolute -translate-y-1/2 pl-2 text-[11px] text-ink-faint"
                    style={{ top: (h - DAY_START) * 60 * PX_PER_MIN }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            </div>

            {/* Columna por profesional */}
            {staff.map((st) => {
              const work = workIntervals(db, st.id, day);
              const items = dayAppts.flatMap((a) =>
                a.items
                  .filter((it) => it.staffId === st.id)
                  .map((it) => ({ appt: a, item: it }))
              );
              const blocks = db.blocks.filter(
                (b) => b.staffId === st.id && sameDay(parseISO(b.startsAt), day)
              );

              return (
                <div
                  key={st.id}
                  className="min-w-[200px] flex-1 border-r border-line last:border-r-0"
                >
                  <div className="flex h-12 items-center gap-2 border-b border-line bg-surface px-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: st.color }}
                    >
                      {st.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">
                        {st.name}
                      </p>
                      <p className="truncate text-[11px] text-ink-faint">
                        {st.title}
                      </p>
                    </div>
                  </div>

                  <div
                    className="relative cursor-copy"
                    style={{ height: gridHeight }}
                    onClick={(e) => {
                      // Tocar una celda vacía crea una cita a esa hora,
                      // ajustada a la grilla del negocio
                      const rect = e.currentTarget.getBoundingClientRect();
                      const minutes = (e.clientY - rect.top) / PX_PER_MIN;
                      const gran = db.business.slotGranularityMin;
                      const snapped = Math.floor(minutes / gran) * gran;
                      const start = new Date(day);
                      start.setHours(DAY_START, snapped, 0, 0);
                      setModal({ staffId: st.id, start });
                    }}
                  >
                    {/* Fuera de turno */}
                    {work.length === 0 ? (
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,#00000006_6px,#00000006_7px)]" />
                    ) : (
                      <>
                        <div
                          className="absolute inset-x-0 top-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,#00000006_6px,#00000006_7px)]"
                          style={{
                            height: Math.max(0, minutesFromDayStart(work[0].start)) * PX_PER_MIN,
                          }}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,#00000006_6px,#00000006_7px)]"
                          style={{
                            height:
                              Math.max(
                                0,
                                (DAY_END - DAY_START) * 60 -
                                  minutesFromDayStart(work[work.length - 1].end)
                              ) * PX_PER_MIN,
                          }}
                        />
                      </>
                    )}

                    {/* Líneas de hora */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute inset-x-0 border-t border-line/70"
                        style={{ top: (h - DAY_START) * 60 * PX_PER_MIN }}
                      />
                    ))}

                    {/* Bloqueos */}
                    {blocks.map((b) => {
                      const s = parseISO(b.startsAt);
                      const e = parseISO(b.endsAt);
                      return (
                        <div
                          key={b.id}
                          className="absolute inset-x-1 rounded border border-dashed border-line-strong bg-paper px-2 py-1 text-[11px] text-ink-faint"
                          style={{
                            top: minutesFromDayStart(s) * PX_PER_MIN,
                            height:
                              ((e.getTime() - s.getTime()) / 60000) * PX_PER_MIN,
                          }}
                        >
                          ⊘ {b.reason}
                        </div>
                      );
                    })}

                    {/* Citas */}
                    {items.map(({ appt, item }) => {
                      const s = parseISO(item.startsAt);
                      const svc = db.services.find((x) => x.id === item.serviceId);
                      const client = db.clients.find((c) => c.id === appt.clientId);
                      return (
                        <button
                          key={appt.id + item.startsAt}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(appt);
                          }}
                          className={`absolute inset-x-1 overflow-hidden rounded border-l-[3px] px-2 py-1 text-left shadow-sm transition-transform hover:scale-[1.01] ${STATUS_STYLE[appt.status]}`}
                          style={{
                            top: minutesFromDayStart(s) * PX_PER_MIN,
                            height: Math.max(item.durationMin * PX_PER_MIN, 24),
                          }}
                        >
                          <p className="truncate text-[11px] font-medium">
                            {fmtTime(s)} · {client?.name}
                          </p>
                          {item.durationMin >= 40 && (
                            <p className="truncate text-[11px] opacity-80">
                              {svc?.name}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de detalle */}
        {selectedFresh && (
          <DetailPanel
            appt={selectedFresh}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {modal && (
        <NewAppointmentModal
          day={day}
          prefill={modal}
          onClose={() => setModal(null)}
        />
      )}
      {showShare && (
        <ShareBookingDialog
          slug={db.business.slug}
          businessName={db.business.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

function DetailPanel({
  appt,
  onClose,
}: {
  appt: Appointment;
  onClose: () => void;
}) {
  const db = useDB();
  const client = db.clients.find((c) => c.id === appt.clientId);
  const actions = NEXT_ACTIONS[appt.status] ?? [];

  return (
    <aside className="fixed inset-0 z-50 flex flex-col bg-surface md:static md:z-auto md:w-80 md:shrink-0 md:border-l md:border-line">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-medium">Detalle de la cita</h2>
        <button
          onClick={onClose}
          className="text-ink-faint transition-colors hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto px-5 py-5">
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLE[appt.status]}`}
        >
          {STATUS_LABEL[appt.status]}
        </span>
        <p className="mt-2 text-xs text-ink-faint">
          Origen: {appt.origin === "online" ? "reserva online" : "creada manualmente"}
        </p>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs uppercase tracking-widest text-ink-faint">Cliente</p>
          <p className="mt-1.5 font-medium">{client?.name}</p>
          <p className="text-sm text-ink-soft">{client?.phone}</p>
          <p className="text-sm text-ink-soft">{client?.email}</p>
          {client?.notes && (
            <p className="mt-2 rounded bg-clay-tint px-3 py-2 text-xs text-ink-soft">
              {client.notes}
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs uppercase tracking-widest text-ink-faint">Servicios</p>
          {appt.items.map((it) => {
            const svc = db.services.find((s) => s.id === it.serviceId);
            const st = db.staff.find((x) => x.id === it.staffId);
            return (
              <div key={it.serviceId + it.startsAt} className="mt-2.5">
                <p className="text-sm font-medium">{svc?.name}</p>
                <p className="text-xs text-ink-faint">
                  {fmtTime(parseISO(it.startsAt))} · {it.durationMin} min · {st?.name}
                </p>
              </div>
            );
          })}
          <p className="mt-4 border-t border-line pt-3 text-sm">
            Total: <span className="font-medium">{fmtCLP(appt.totalClp)}</span>
          </p>
        </div>

        {appt.clientNote && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs uppercase tracking-widest text-ink-faint">
              Nota del cliente
            </p>
            <p className="mt-1.5 text-sm text-ink-soft">{appt.clientNote}</p>
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="space-y-2 border-t border-line px-5 py-4">
          {actions.map((a) => (
            <button
              key={a.to}
              onClick={() => setAppointmentStatus(appt.id, a.to)}
              className={`w-full rounded-md py-2.5 text-sm font-medium transition-colors ${
                a.to === "cancelada" || a.to === "no_show"
                  ? "border border-line-strong text-ink-soft hover:border-danger hover:text-danger"
                  : "bg-sage text-white hover:bg-sage-deep"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
