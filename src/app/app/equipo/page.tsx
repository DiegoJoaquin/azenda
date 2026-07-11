"use client";

import { useState } from "react";
import {
  useDB,
  addStaff,
  setStaffActive,
  addTimeBlock,
  removeTimeBlock,
} from "@/lib/store";
import { dateKey, fmtDayShort, fmtTime, parseISO } from "@/lib/dates";
import type { Staff } from "@/lib/types";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const PALETTE = ["#3f5c4b", "#b0713f", "#3d5568", "#7a5b7d", "#8a6d3b", "#4f6d7a", "#6b4f4f"];

export default function EquipoPage() {
  const db = useDB();
  const [showAdd, setShowAdd] = useState(false);
  const [blockFor, setBlockFor] = useState<Staff | null>(null);

  const activeStaff = [...db.staff]
    .filter((s) => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const inactiveStaff = db.staff.filter((s) => !s.active);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-surface px-8 py-4">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Equipo</h1>
          <p className="text-sm text-ink-faint">
            Profesionales, sus turnos y servicios habilitados
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-sage px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
        >
          + Agregar profesional
        </button>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-8 py-10">
        {activeStaff.map((st) => {
          const services = db.staffServices
            .filter((ss) => ss.staffId === st.id)
            .map((ss) => db.services.find((s) => s.id === ss.serviceId))
            .filter((s) => s && s.active);
          const futureBlocks = db.blocks
            .filter(
              (b) => b.staffId === st.id && parseISO(b.endsAt) >= new Date()
            )
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

          return (
            <div
              key={st.id}
              className="overflow-hidden rounded-lg border border-line bg-surface"
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full font-medium text-white"
                    style={{ backgroundColor: st.color }}
                  >
                    {st.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <div>
                    <p className="font-medium">{st.name}</p>
                    <p className="text-sm text-ink-faint">{st.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBlockFor(st)}
                    className="rounded-md border border-line px-3.5 py-2 text-sm transition-colors hover:border-line-strong"
                  >
                    ⊘ Bloquear horario
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Quitar a ${st.name} del equipo? Dejará de aparecer en la agenda y en las reservas online. Su historial se conserva.`
                        )
                      )
                        setStaffActive(st.id, false);
                    }}
                    className="rounded-md border border-line px-3.5 py-2 text-sm text-ink-soft transition-colors hover:border-danger hover:text-danger"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-ink-faint">
                    Turnos semanales
                  </p>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((label, weekday) => {
                      const sched = db.schedules.find(
                        (s) => s.staffId === st.id && s.weekday === weekday
                      );
                      return (
                        <div
                          key={weekday}
                          className={`flex-1 rounded-md border px-1 py-2 text-center ${
                            sched
                              ? "border-sage/40 bg-sage-tint"
                              : "border-line bg-paper opacity-50"
                          }`}
                        >
                          <p className="text-[11px] font-medium">{label}</p>
                          <p className="mt-0.5 text-[10px] leading-tight text-ink-soft">
                            {sched ? (
                              <>
                                {sched.start}
                                <br />
                                {sched.end}
                              </>
                            ) : (
                              "libre"
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-ink-faint">
                    Servicios que realiza
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {services.map((s) => (
                      <span
                        key={s!.id}
                        className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-soft"
                      >
                        {s!.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {futureBlocks.length > 0 && (
                <div className="border-t border-line bg-paper px-6 py-3">
                  <p className="mb-2 text-xs uppercase tracking-widest text-ink-faint">
                    Bloqueos próximos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {futureBlocks.map((b) => {
                      const s = parseISO(b.startsAt);
                      const e = parseISO(b.endsAt);
                      return (
                        <span
                          key={b.id}
                          className="flex items-center gap-2 rounded-md border border-dashed border-line-strong bg-surface px-3 py-1.5 text-xs text-ink-soft"
                        >
                          {fmtDayShort(s)} · {fmtTime(s)}–{fmtTime(e)} · {b.reason}
                          <button
                            onClick={() => removeTimeBlock(b.id)}
                            className="text-ink-faint transition-colors hover:text-danger"
                            title="Quitar bloqueo"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {inactiveStaff.length > 0 && (
          <section className="rounded-lg border border-line bg-paper px-6 py-4">
            <p className="text-xs uppercase tracking-widest text-ink-faint">
              Fuera del equipo
            </p>
            <div className="mt-3 space-y-2">
              {inactiveStaff.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-soft">
                    {st.name} · {st.title}
                  </span>
                  <button
                    onClick={() => setStaffActive(st.id, true)}
                    className="text-sage hover:underline"
                  >
                    Reincorporar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} />}
      {blockFor && (
        <BlockModal staff={blockFor} onClose={() => setBlockFor(null)} />
      )}
    </div>
  );
}

// ---------- Modal: agregar profesional ----------

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const db = useDB();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<number[]>([2, 3, 4, 5, 6]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  function save() {
    if (!name.trim()) return setError("El nombre es obligatorio.");
    if (days.length === 0) return setError("Elige al menos un día de trabajo.");
    if (serviceIds.length === 0)
      return setError("Selecciona los servicios que realizará.");
    addStaff({
      name: name.trim(),
      title: title.trim() || "Profesional",
      color: PALETTE[db.staff.length % PALETTE.length],
      serviceIds,
      weekdays: days,
      start,
      end,
    });
    onClose();
  }

  return (
    <Modal title="Agregar profesional" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre y apellido"
            className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cargo (ej: Estilista)"
            className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm text-ink-soft">
            Días de trabajo
          </span>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((label, wd) => (
              <button
                key={wd}
                onClick={() =>
                  setDays((p) =>
                    p.includes(wd) ? p.filter((x) => x !== wd) : [...p, wd]
                  )
                }
                className={`flex-1 rounded-md border py-2 text-xs transition-colors ${
                  days.includes(wd)
                    ? "border-sage bg-sage-tint font-medium"
                    : "border-line bg-paper text-ink-faint"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Entrada</span>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Salida</span>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
            />
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-sm text-ink-soft">
            Servicios que realiza
          </span>
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-auto">
            {db.services
              .filter((s) => s.active)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    setServiceIds((p) =>
                      p.includes(s.id)
                        ? p.filter((x) => x !== s.id)
                        : [...p, s.id]
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    serviceIds.includes(s.id)
                      ? "border-sage bg-sage-tint"
                      : "border-line bg-paper text-ink-soft"
                  }`}
                >
                  {s.name}
                </button>
              ))}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <ModalFooter onClose={onClose} onSave={save} saveLabel="Agregar al equipo" />
    </Modal>
  );
}

// ---------- Modal: bloquear horario ----------

function BlockModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const [date, setDate] = useState(dateKey(new Date()));
  const [from, setFrom] = useState("13:00");
  const [to, setTo] = useState("14:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function save() {
    if (from >= to) return setError("La hora de término debe ser mayor a la de inicio.");
    addTimeBlock({
      staffId: staff.id,
      startsAt: `${date}T${from}:00`,
      endsAt: `${date}T${to}:00`,
      reason: reason.trim() || "Bloqueado",
    });
    onClose();
  }

  return (
    <Modal title={`Bloquear horario · ${staff.name}`} onClose={onClose}>
      <p className="text-sm text-ink-soft">
        El horario bloqueado desaparece de la disponibilidad online y se marca
        en la agenda.
      </p>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-soft">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Desde</span>
            <input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Hasta</span>
            <input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
            />
          </label>
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (ej: almuerzo, trámite, capacitación)"
          className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
        />
        {error && (
          <p className="rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      <ModalFooter onClose={onClose} onSave={save} saveLabel="Bloquear" />
    </Modal>
  );
}

// ---------- Piezas compartidas ----------

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-xl tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  onSave,
  saveLabel,
}: {
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="-mx-6 -mb-5 mt-5 flex justify-end gap-3 border-t border-line px-6 py-4">
      <button
        onClick={onClose}
        className="rounded-md border border-line-strong px-5 py-2.5 text-sm transition-colors hover:border-ink"
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        className="rounded-md bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
      >
        {saveLabel}
      </button>
    </div>
  );
}
