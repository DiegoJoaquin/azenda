"use client";

// Store central con tres modos:
//  - "demo":   datos en localStorage (la demo de la landing)
//  - "cloud":  panel de un negocio real; lecturas desde snapshot de
//              Supabase, escrituras optimistas local + Supabase
//  - "public": mini-sitio de reservas de un negocio real (anónimo);
//              la reserva va por RPC transaccional
// Los componentes usan siempre la misma interfaz síncrona (useDB + acciones).

import { useSyncExternalStore } from "react";
import type {
  DB,
  Appointment,
  AppointmentStatus,
  Business,
  Client,
  Service,
  Staff,
  TimeBlock,
} from "./types";
import { buildDemoDB } from "./demo-data";
import { toISO, addMinutes } from "./dates";
import * as cloud from "./cloud";

// v2: se agregó historial de citas para finanzas — al subir la versión,
// los navegadores con datos v1 se regeneran automáticamente.
const KEY = "azenda-db-v2";

type Mode = "demo" | "cloud" | "public";
let mode: Mode = "demo";
let cache: DB | null = null;
const listeners = new Set<() => void>();

export function getMode(): Mode {
  return mode;
}

/** Activa el modo demo (rutas /demo y /aura-estudio). Idempotente. */
export function ensureDemoMode() {
  if (mode !== "demo") {
    mode = "demo";
    cache = null;
  }
  load();
}

/** El layout del panel real inyecta el snapshot traído de Supabase. */
export function setCloudSnapshot(db: DB) {
  mode = "cloud";
  cache = db;
  listeners.forEach((l) => l());
}

/** El mini-sitio real inyecta el snapshot público. */
export function setPublicSnapshot(db: DB) {
  mode = "public";
  cache = db;
  listeners.forEach((l) => l());
}

function load(): DB {
  if (cache) return cache;
  if (mode !== "demo") {
    // Aún no llega el snapshot: placeholder vacío (los gates evitan
    // renderizar las páginas antes de tiempo).
    return buildDemoDB();
  }
  if (typeof window === "undefined") {
    cache = buildDemoDB();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch {
    // localStorage corrupto o inaccesible: se regenera la demo
  }
  cache = buildDemoDB();
  persist();
  return cache;
}

function persist() {
  if (mode === "demo" && typeof window !== "undefined" && cache) {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function getDB(): DB {
  return load();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB, getDB);
}

export function resetDemo() {
  if (mode !== "demo") return;
  cache = buildDemoDB();
  emit();
}

function mutate(fn: (db: DB) => void) {
  const db = load();
  cache = structuredClone(db);
  fn(cache);
  emit();
}

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Acciones (optimistas local; en cloud replican a Supabase) ----------

export function upsertClientByEmail(data: {
  name: string;
  email: string;
  phone: string;
}): Client {
  const db = load();
  const existing = db.clients.find(
    (c) => c.email.toLowerCase() === data.email.toLowerCase()
  );
  if (existing) return existing;
  const client: Client = {
    id: newId("cl"),
    name: data.name,
    email: data.email,
    phone: data.phone,
    notes: "",
    createdAt: new Date().toISOString(),
  };
  mutate((d) => d.clients.push(client));
  if (mode === "cloud") cloud.cloudInsertClient(load().business.id, client);
  return client;
}

export function addAppointment(appt: Appointment) {
  mutate((d) => d.appointments.push(appt));
  if (mode === "cloud") cloud.cloudAddAppointment(load().business.id, appt);
}

export function setAppointmentStatus(id: string, status: AppointmentStatus) {
  mutate((d) => {
    const a = d.appointments.find((x) => x.id === id);
    if (a) a.status = status;
  });
  if (mode === "cloud") cloud.cloudSetAppointmentStatus(id, status);
}

export function updateClientNotes(id: string, notes: string) {
  mutate((d) => {
    const c = d.clients.find((x) => x.id === id);
    if (c) c.notes = notes;
  });
  if (mode === "cloud") cloud.cloudUpdateClientNotes(id, notes);
}

export function updateBusiness(patch: Partial<Business>) {
  mutate((d) => {
    d.business = { ...d.business, ...patch };
  });
  if (mode === "cloud") cloud.cloudUpdateBusiness(load().business.id, patch);
}

// ---------- Equipo ----------

export function addStaff(data: {
  name: string;
  title: string;
  color: string;
  serviceIds: string[];
  weekdays: number[];
  start: string;
  end: string;
}): Staff {
  const staff: Staff = {
    id: newId("s"),
    name: data.name,
    title: data.title,
    color: data.color,
    bookableOnline: true,
    active: true,
    sortOrder: 99,
  };
  mutate((d) => {
    d.staff.push(staff);
    for (const weekday of data.weekdays) {
      d.schedules.push({
        id: newId("sch"),
        staffId: staff.id,
        weekday,
        start: data.start,
        end: data.end,
      });
    }
    for (const serviceId of data.serviceIds) {
      d.staffServices.push({ staffId: staff.id, serviceId });
    }
  });
  if (mode === "cloud") {
    cloud.cloudAddStaff(
      load().business.id,
      staff,
      data.weekdays.map((weekday) => ({
        weekday,
        start: data.start,
        end: data.end,
      })),
      data.serviceIds
    );
  }
  return staff;
}

// "Quitar" desactiva en vez de borrar: las citas históricas del
// profesional deben seguir existiendo para reportes y finanzas.
export function setStaffActive(id: string, active: boolean) {
  mutate((d) => {
    const s = d.staff.find((x) => x.id === id);
    if (s) s.active = active;
  });
  if (mode === "cloud") cloud.cloudSetStaffActive(id, active);
}

// ---------- Bloqueos de horario ----------

export function addTimeBlock(block: Omit<TimeBlock, "id">): TimeBlock {
  const b: TimeBlock = { ...block, id: newId("blk") };
  mutate((d) => d.blocks.push(b));
  if (mode === "cloud") cloud.cloudAddTimeBlock(load().business.id, b);
  return b;
}

export function removeTimeBlock(id: string) {
  mutate((d) => {
    d.blocks = d.blocks.filter((b) => b.id !== id);
  });
  if (mode === "cloud") cloud.cloudRemoveTimeBlock(id);
}

// ---------- Servicios ----------

export function addService(
  data: Omit<Service, "id" | "active" | "sortOrder">,
  staffIds: string[]
): Service {
  const service: Service = { ...data, id: newId("sv"), active: true, sortOrder: 99 };
  mutate((d) => {
    d.services.push(service);
    for (const staffId of staffIds) {
      d.staffServices.push({ staffId, serviceId: service.id });
    }
  });
  if (mode === "cloud") cloud.cloudAddService(load().business.id, service, staffIds);
  return service;
}

// Igual que con el equipo: desactivar preserva el historial.
export function setServiceActive(id: string, active: boolean) {
  mutate((d) => {
    const s = d.services.find((x) => x.id === id);
    if (s) {
      s.active = active;
      s.visibleOnline = active;
    }
  });
  if (mode === "cloud") cloud.cloudSetServiceActive(id, active, active);
}

// ---------- Reserva del cliente final (mini-sitio) ----------

export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  note: string;
  items: { serviceId: string; staffId: string; startsAt: Date }[];
}

export type BookingResult =
  | { ok: true; appt: Appointment }
  | { ok: false; error: "SLOT_TAKEN" | "LIMIT" | "PAUSED" | "UNKNOWN" };

export async function submitBooking(req: BookingRequest): Promise<BookingResult> {
  const db = load();
  const services = new Map(db.services.map((s) => [s.id, s]));
  const items = req.items.map((it) => {
    const svc = services.get(it.serviceId)!;
    return {
      serviceId: it.serviceId,
      staffId: it.staffId,
      startsAt: toISO(it.startsAt),
      durationMin: svc.durationMin,
      priceClp: svc.priceClp,
    };
  });
  const last = items[items.length - 1];
  const total = items.reduce((s, it) => s + it.priceClp, 0);

  const buildAppt = (id: string): Appointment => ({
    id,
    clientId: "public",
    status: db.business.requiresApproval ? "pendiente" : "confirmada",
    origin: "online",
    startsAt: items[0].startsAt,
    endsAt: toISO(addMinutes(new Date(last.startsAt), last.durationMin)),
    totalClp: total,
    clientNote: req.note || undefined,
    createdAt: new Date().toISOString(),
    items,
  });

  if (mode === "public") {
    try {
      const apptId = await cloud.rpcBookAppointment({
        businessId: db.business.id,
        clientName: req.name,
        clientEmail: req.email,
        clientPhone: req.phone,
        clientNote: req.note,
        items: items.map((it) => ({
          serviceId: it.serviceId,
          staffId: it.staffId,
          startsAt: it.startsAt,
        })),
      });
      // Reflejar la reserva en la disponibilidad local (como intervalo ocupado)
      mutate((d) => {
        for (const it of items) {
          const svc = services.get(it.serviceId)!;
          d.blocks.push({
            id: newId("busy"),
            staffId: it.staffId,
            startsAt: it.startsAt,
            endsAt: toISO(
              addMinutes(new Date(it.startsAt), it.durationMin + svc.bufferAfterMin)
            ),
            reason: "ocupado",
          });
        }
      });
      return { ok: true, appt: buildAppt(apptId) };
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === "SLOT_TAKEN") return { ok: false, error: "SLOT_TAKEN" };
        if (e.message === "BOOKING_LIMIT" || e.message === "BOOKING_RATE") {
          return { ok: false, error: "LIMIT" };
        }
        if (e.message === "BOOKING_PAUSED") return { ok: false, error: "PAUSED" };
      }
      console.error("[submitBooking]", e);
      return { ok: false, error: "UNKNOWN" };
    }
  }

  // Modo demo (y cloud, si un miembro reserva desde su propio mini-sitio)
  const client = upsertClientByEmail({
    name: req.name,
    email: req.email,
    phone: req.phone,
  });
  const appt = buildAppt(newId("appt"));
  appt.clientId = client.id;
  addAppointment(appt);
  return { ok: true, appt };
}
