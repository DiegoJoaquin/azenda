"use client";

// Creación manual de citas desde el panel. Se abre con el botón
// "Nueva cita" o al tocar una celda vacía de la agenda (que prellenar
// profesional y hora). El admin agenda sin restricción de anticipación,
// pero siempre dentro de los turnos y sin pisar otras citas.

import { useMemo, useState } from "react";
import { useDB, upsertClientByEmail, addAppointment, newId } from "@/lib/store";
import { getAvailableSlots } from "@/lib/availability";
import { terms } from "@/lib/terms";
import {
  dateKey,
  fmtCLP,
  fmtDuration,
  fmtTime,
  toISO,
  addMinutes,
} from "@/lib/dates";
import type { Appointment } from "@/lib/types";

export interface ModalPrefill {
  staffId?: string;
  start?: Date;
}

export default function NewAppointmentModal({
  day,
  prefill,
  onClose,
}: {
  day: Date;
  prefill: ModalPrefill;
  onClose: () => void;
}) {
  const db = useDB();
  const t = terms(db.business.vertical);

  const defaultService = prefill.staffId
    ? db.staffServices.find((ss) => ss.staffId === prefill.staffId)?.serviceId
    : db.services[0]?.id;

  const [serviceId, setServiceId] = useState(defaultService ?? "");
  const [staffId, setStaffId] = useState<string>(prefill.staffId ?? "");
  const [dateStr, setDateStr] = useState(dateKey(prefill.start ?? day));
  const [slotISO, setSlotISO] = useState<string>(
    prefill.start ? toISO(prefill.start) : ""
  );
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const service = db.services.find((s) => s.id === serviceId);

  const eligibleStaff = useMemo(
    () =>
      db.staff.filter(
        (st) =>
          st.active &&
          db.staffServices.some(
            (ss) => ss.staffId === st.id && ss.serviceId === serviceId
          )
      ),
    [db, serviceId]
  );

  // Si el profesional elegido no realiza el servicio, se limpia
  const effectiveStaffId = eligibleStaff.some((s) => s.id === staffId)
    ? staffId
    : "";

  const selectedDay = useMemo(() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [dateStr]);

  const slots = useMemo(
    () =>
      serviceId
        ? getAvailableSlots(
            db,
            selectedDay,
            [{ serviceId, staffId: effectiveStaffId || null }],
            { ignoreLead: true }
          )
        : [],
    [db, selectedDay, serviceId, effectiveStaffId]
  );

  function save() {
    if (!service || !slotISO) {
      setError("Elige un servicio y un horario disponible.");
      return;
    }
    // Re-validación al momento de guardar: si otra cita tomó el horario
    // mientras el modal estaba abierto, se rechaza (sin sobrecupos).
    const freshSlots = getAvailableSlots(
      db,
      selectedDay,
      [{ serviceId, staffId: effectiveStaffId || null }],
      { ignoreLead: true }
    );
    const slot = freshSlots.find((s) => toISO(s.start) === slotISO);
    if (!slot) {
      setError("Ese horario ya no está disponible. Elige otro, por favor.");
      setSlotISO("");
      return;
    }
    let client;
    if (newClient) {
      if (!form.name.trim() || !form.phone.trim()) {
        setError("El cliente nuevo necesita al menos nombre y teléfono.");
        return;
      }
      client = upsertClientByEmail({
        name: form.name.trim(),
        email: form.email.trim() || `${Date.now()}@sin-correo.local`,
        phone: form.phone.trim(),
      });
    } else {
      client = db.clients.find((c) => c.id === clientId);
      if (!client) {
        setError("Selecciona un cliente o crea uno nuevo.");
        return;
      }
    }

    const a = slot.assignment[0];
    const appt: Appointment = {
      id: newId("appt"),
      clientId: client.id,
      status: "confirmada",
      origin: "manual",
      startsAt: toISO(a.startsAt),
      endsAt: toISO(addMinutes(a.startsAt, service.durationMin)),
      totalClp: service.priceClp,
      createdAt: new Date().toISOString(),
      items: [
        {
          serviceId: service.id,
          staffId: a.staffId,
          startsAt: toISO(a.startsAt),
          durationMin: service.durationMin,
          priceClp: service.priceClp,
        },
      ],
    };
    addAppointment(appt);
    onClose();
  }

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
          <h2 className="font-serif text-xl tracking-tight">Nueva cita</h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Cliente */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Cliente</span>
              <button
                onClick={() => {
                  setNewClient(!newClient);
                  setError("");
                }}
                className="text-xs text-sage hover:underline"
              >
                {newClient ? "← Elegir existente" : "+ Cliente nuevo"}
              </button>
            </div>
            {newClient ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre y apellido"
                  className="col-span-2 rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Teléfono"
                  className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Correo (opcional)"
                  className="rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
                />
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
              >
                <option value="">Seleccionar cliente…</option>
                {[...db.clients]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Servicio */}
          <div>
            <span className="mb-1.5 block text-sm text-ink-soft">Servicio</span>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setSlotISO("");
              }}
              className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
            >
              {db.categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {db.services
                    .filter((s) => s.categoryId === cat.id && s.active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {fmtDuration(s.durationMin)} · {fmtCLP(s.priceClp)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Profesional y fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1.5 block text-sm text-ink-soft">{t.ResourceCap}</span>
              <select
                value={effectiveStaffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  setSlotISO("");
                }}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
              >
                <option value="">{t.any}</option>
                {eligibleStaff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-sm text-ink-soft">Fecha</span>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  setSlotISO("");
                }}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
              />
            </div>
          </div>

          {/* Horarios */}
          <div>
            <span className="mb-1.5 block text-sm text-ink-soft">
              Horarios disponibles
            </span>
            {slots.length === 0 ? (
              <p className="rounded-md border border-line bg-paper px-4 py-5 text-center text-sm text-ink-faint">
                Sin horas libres ese día para este servicio.
              </p>
            ) : (
              <div className="grid max-h-40 grid-cols-5 gap-1.5 overflow-auto">
                {slots.map((s) => {
                  const iso = toISO(s.start);
                  return (
                    <button
                      key={iso}
                      onClick={() => setSlotISO(iso)}
                      className={`rounded-md border py-2 text-sm transition-colors ${
                        slotISO === iso
                          ? "border-sage bg-sage text-white"
                          : "border-line bg-paper hover:border-sage"
                      }`}
                    >
                      {fmtTime(s.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-line-strong px-5 py-2.5 text-sm transition-colors hover:border-ink"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="rounded-md bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
          >
            Agendar cita
          </button>
        </div>
      </div>
    </div>
  );
}
