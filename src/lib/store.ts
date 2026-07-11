"use client";

// Store de la demo: la "base de datos" vive en localStorage y se comparte
// entre el panel admin y el mini-sitio de reservas. Al conectar Supabase,
// esta capa se reemplaza por llamadas al cliente de Supabase manteniendo
// la misma interfaz.

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

// v2: se agregó historial de citas para finanzas — al subir la versión,
// los navegadores con datos v1 se regeneran automáticamente.
const KEY = "azenda-db-v2";
let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
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
  if (typeof window !== "undefined" && cache) {
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
  cache = buildDemoDB();
  emit();
}

function mutate(fn: (db: DB) => void) {
  const db = load();
  cache = structuredClone(db);
  fn(cache);
  emit();
}

let seq = 0;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

// ---------- Acciones ----------

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
  return client;
}

export function addAppointment(appt: Appointment) {
  mutate((d) => d.appointments.push(appt));
}

export function setAppointmentStatus(id: string, status: AppointmentStatus) {
  mutate((d) => {
    const a = d.appointments.find((x) => x.id === id);
    if (a) a.status = status;
  });
}

export function updateClientNotes(id: string, notes: string) {
  mutate((d) => {
    const c = d.clients.find((x) => x.id === id);
    if (c) c.notes = notes;
  });
}

export function updateBusiness(patch: Partial<Business>) {
  mutate((d) => {
    d.business = { ...d.business, ...patch };
  });
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
  return staff;
}

// "Quitar" desactiva en vez de borrar: las citas históricas del
// profesional deben seguir existiendo para reportes y finanzas.
export function setStaffActive(id: string, active: boolean) {
  mutate((d) => {
    const s = d.staff.find((x) => x.id === id);
    if (s) s.active = active;
  });
}

// ---------- Bloqueos de horario ----------

export function addTimeBlock(block: Omit<TimeBlock, "id">): TimeBlock {
  const b: TimeBlock = { ...block, id: newId("blk") };
  mutate((d) => d.blocks.push(b));
  return b;
}

export function removeTimeBlock(id: string) {
  mutate((d) => {
    d.blocks = d.blocks.filter((b) => b.id !== id);
  });
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
  return service;
}

// Igual que con el equipo: desactivar preserva el historial.
export function setServiceActive(id: string, active: boolean) {
  mutate((d) => {
    const s = d.services.find((x) => x.id === id);
    if (s) {
      s.active = active;
      if (!active) s.visibleOnline = false;
      else s.visibleOnline = true;
    }
  });
}
