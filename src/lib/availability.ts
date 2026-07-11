// Motor de disponibilidad.
// Los horarios libres NO se almacenan: se calculan en tiempo real como
//   turnos del profesional − citas existentes (con buffers) − bloqueos
//   − restricciones del negocio (anticipación mín/máx),
// discretizados en la grilla del negocio (slotGranularityMin).

import type { DB, Service, Staff } from "./types";
import { addMinutes, atTime, parseISO, sameDay } from "./dates";

interface Interval {
  start: Date;
  end: Date;
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Intervalos de trabajo de un profesional en un día dado. */
export function workIntervals(db: DB, staffId: string, day: Date): Interval[] {
  return db.schedules
    .filter((s) => s.staffId === staffId && s.weekday === day.getDay())
    .map((s) => ({ start: atTime(day, s.start), end: atTime(day, s.end) }));
}

/** Intervalos ocupados (citas activas con buffers + bloqueos) de un día. */
export function busyIntervals(db: DB, staffId: string, day: Date): Interval[] {
  const busy: Interval[] = [];
  const active = new Set(["pendiente", "confirmada", "atendida"]);

  for (const appt of db.appointments) {
    if (!active.has(appt.status)) continue;
    for (const item of appt.items) {
      if (item.staffId !== staffId) continue;
      const start = parseISO(item.startsAt);
      if (!sameDay(start, day)) continue;
      const svc = db.services.find((s) => s.id === item.serviceId);
      const before = svc?.bufferBeforeMin ?? 0;
      const after = svc?.bufferAfterMin ?? 0;
      busy.push({
        start: addMinutes(start, -before),
        end: addMinutes(start, item.durationMin + after),
      });
    }
  }

  for (const blk of db.blocks) {
    if (blk.staffId !== staffId) continue;
    const start = parseISO(blk.startsAt);
    if (!sameDay(start, day)) continue;
    busy.push({ start, end: parseISO(blk.endsAt) });
  }

  return busy;
}

/** ¿Puede `staffId` atender `service` comenzando en `start`? */
function staffFree(
  db: DB,
  staffId: string,
  service: Service,
  start: Date
): boolean {
  const day = start;
  const end = addMinutes(start, service.durationMin);
  const needed: Interval = {
    start: addMinutes(start, -service.bufferBeforeMin),
    end: addMinutes(end, service.bufferAfterMin),
  };

  const work = workIntervals(db, staffId, day);
  const inShift = work.some((w) => start >= w.start && end <= w.end);
  if (!inShift) return false;

  return !busyIntervals(db, staffId, day).some((b) => overlaps(b, needed));
}

export interface BookingSelection {
  serviceId: string;
  staffId: string | null; // null = cualquier profesional
}

export interface SlotOption {
  start: Date;
  /** Asignación resuelta de profesional por servicio, en orden. */
  assignment: { serviceId: string; staffId: string; startsAt: Date }[];
}

/**
 * Slots disponibles para una secuencia de servicios en un día.
 * Los servicios se agendan consecutivos; si un servicio no tiene
 * profesional elegido se asigna el primero habilitado que esté libre.
 */
export function getAvailableSlots(
  db: DB,
  day: Date,
  selections: BookingSelection[],
  opts?: { ignoreLead?: boolean }
): SlotOption[] {
  if (selections.length === 0) return [];
  const gran = db.business.slotGranularityMin;
  const now = new Date();
  // El panel admin agenda sin restricción de anticipación (ignoreLead);
  // el mini-sitio público respeta las políticas del negocio.
  const minStart = opts?.ignoreLead
    ? now
    : addMinutes(now, db.business.minLeadMinutes);
  const maxDay = addMinutes(now, db.business.maxLeadDays * 24 * 60);
  if (
    atTime(day, "23:59") < minStart ||
    (!opts?.ignoreLead && atTime(day, "00:00") > maxDay)
  ) {
    return [];
  }

  const services = selections.map(
    (sel) => db.services.find((s) => s.id === sel.serviceId)!
  );

  // Rango candidato: unión de turnos de los profesionales elegibles del 1er servicio
  const candidates: SlotOption[] = [];
  const dayStart = atTime(day, "07:00");
  const dayEnd = atTime(day, "21:00");

  for (
    let t = new Date(dayStart);
    t < dayEnd;
    t = addMinutes(t, gran)
  ) {
    if (t < minStart) continue;
    const assignment = tryAssign(db, t, selections, services);
    if (assignment) candidates.push({ start: new Date(t), assignment });
  }
  return candidates;
}

function eligibleStaff(db: DB, serviceId: string): Staff[] {
  const ids = db.staffServices
    .filter((ss) => ss.serviceId === serviceId)
    .map((ss) => ss.staffId);
  return db.staff.filter(
    (s) => s.active && s.bookableOnline && ids.includes(s.id)
  );
}

function tryAssign(
  db: DB,
  start: Date,
  selections: BookingSelection[],
  services: Service[]
): SlotOption["assignment"] | null {
  const assignment: SlotOption["assignment"] = [];
  let cursor = new Date(start);

  for (let i = 0; i < selections.length; i++) {
    const sel = selections[i];
    const svc = services[i];
    let chosen: string | null = null;

    if (sel.staffId) {
      if (staffFree(db, sel.staffId, svc, cursor)) chosen = sel.staffId;
    } else {
      // Menor carga primero para repartir las citas del día
      const options = eligibleStaff(db, svc.id).sort(
        (a, b) =>
          busyIntervals(db, a.id, cursor).length -
          busyIntervals(db, b.id, cursor).length
      );
      chosen = options.find((s) => staffFree(db, s.id, svc, cursor))?.id ?? null;
    }

    if (!chosen) return null;
    assignment.push({ serviceId: svc.id, staffId: chosen, startsAt: new Date(cursor) });
    cursor = addMinutes(cursor, svc.durationMin);
  }
  return assignment;
}

/** Días con al menos un slot disponible (para pintar el calendario). */
export function dayHasAvailability(
  db: DB,
  day: Date,
  selections: BookingSelection[]
): boolean {
  return getAvailableSlots(db, day, selections).length > 0;
}
