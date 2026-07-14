// Tipos espejo del esquema de Supabase (supabase/migrations/0001_schema.sql).
// La demo local usa estos mismos tipos; al conectar Supabase solo cambia la
// capa de acceso a datos.

export type Vertical =
  | "peluqueria"
  | "barberia"
  | "spa_estetica"
  | "clinica_salud"
  | "psicologia"
  | "fitness"
  | "generico";

export type AppointmentStatus =
  | "pendiente"
  | "confirmada"
  | "atendida"
  | "completada"
  | "cancelada"
  | "no_show";

export type AppointmentOrigin = "online" | "manual";

export type PlanStatus = "trial" | "active" | "suspended";

export interface Business {
  id: string;
  slug: string;
  name: string;
  vertical: Vertical;
  description: string;
  phone: string;
  address: string;
  timezone: string;
  onlineBookingEnabled: boolean;
  requiresApproval: boolean;
  minLeadMinutes: number;
  maxLeadDays: number;
  cancellationHours: number;
  slotGranularityMin: number;
  planStatus: PlanStatus;
  trialEndsAt: string; // ISO
  logoUrl?: string; // data URL o URL del logo
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  color: string; // color del calendario
  bookableOnline: boolean;
  active: boolean;
  sortOrder: number;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  weekday: number; // 0 = domingo … 6 = sábado
  start: string; // "09:00"
  end: string; // "18:30"
}

export interface TimeBlock {
  id: string;
  staffId: string;
  startsAt: string; // ISO local
  endsAt: string;
  reason: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  priceClp: number;
  visibleOnline: boolean;
  active: boolean;
  sortOrder: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface AppointmentItem {
  serviceId: string;
  staffId: string;
  startsAt: string; // ISO local
  durationMin: number;
  priceClp: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  status: AppointmentStatus;
  origin: AppointmentOrigin;
  startsAt: string;
  endsAt: string;
  totalClp: number;
  clientNote?: string;
  createdAt: string;
  items: AppointmentItem[];
}

export interface DB {
  business: Business;
  staff: Staff[];
  schedules: StaffSchedule[];
  blocks: TimeBlock[];
  categories: ServiceCategory[];
  services: Service[];
  staffServices: { staffId: string; serviceId: string }[];
  clients: Client[];
  appointments: Appointment[];
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  atendida: "Atendida",
  completada: "Completada",
  cancelada: "Cancelada",
  no_show: "No asistió",
};

/** Cuenta bloqueada: suspendida o con la prueba vencida. */
export function isBusinessLocked(b: Business): boolean {
  if (b.planStatus === "suspended") return true;
  if (b.planStatus === "trial") return new Date(b.trialEndsAt) < new Date();
  return false;
}

export const VERTICAL_LABEL: Record<Vertical, string> = {
  peluqueria: "Peluquería",
  barberia: "Barbería",
  spa_estetica: "Spa y estética",
  clinica_salud: "Clínica y salud",
  psicologia: "Psicología",
  fitness: "Fitness",
  generico: "Servicios generales",
};
