// Datos de demostración: "Aura Estudio", peluquería y estética en Providencia.
// Las citas se generan relativas a la fecha actual para que la agenda
// siempre se vea viva.

import { addDays, atTime, toISO, addMinutes } from "./dates";
import type { DB, Appointment, AppointmentStatus } from "./types";

const business = {
  id: "b-aura",
  slug: "aura-estudio",
  name: "Aura Estudio",
  vertical: "peluqueria" as const,
  description:
    "Peluquería y estética integral en el corazón de Providencia. Color, corte y cuidado con productos profesionales.",
  phone: "+56 9 5555 1234",
  address: "Av. Providencia 1234, Providencia, Santiago",
  timezone: "America/Santiago",
  onlineBookingEnabled: true,
  requiresApproval: false,
  minLeadMinutes: 60,
  maxLeadDays: 45,
  cancellationHours: 24,
  slotGranularityMin: 15,
  planStatus: "active" as const,
  trialEndsAt: "2099-01-01T00:00:00",
};

const staff = [
  { id: "s-valentina", name: "Valentina Reyes", title: "Estilista senior", color: "#3f5c4b", bookableOnline: true, active: true, sortOrder: 0 },
  { id: "s-camila", name: "Camila Fuentes", title: "Colorista", color: "#b0713f", bookableOnline: true, active: true, sortOrder: 1 },
  { id: "s-martin", name: "Martín Soto", title: "Barbero", color: "#3d5568", bookableOnline: true, active: true, sortOrder: 2 },
  { id: "s-josefa", name: "Josefa Lagos", title: "Esteticista", color: "#7a5b7d", bookableOnline: true, active: true, sortOrder: 3 },
];

// Turnos: martes a sábado (0=dom … 6=sáb)
const schedules = staff.flatMap((s, i) =>
  [2, 3, 4, 5, 6].map((weekday) => ({
    id: `sch-${s.id}-${weekday}`,
    staffId: s.id,
    weekday,
    start: i % 2 === 0 ? "09:00" : "10:00",
    end: weekday === 6 ? "15:00" : i % 2 === 0 ? "18:00" : "19:00",
  }))
);

const categories = [
  { id: "c-cabello", name: "Cabello", sortOrder: 0 },
  { id: "c-color", name: "Color", sortOrder: 1 },
  { id: "c-barberia", name: "Barbería", sortOrder: 2 },
  { id: "c-estetica", name: "Estética", sortOrder: 3 },
];

const services = [
  { id: "sv-corte-m", categoryId: "c-cabello", name: "Corte mujer", description: "Lavado, corte y secado.", durationMin: 45, bufferBeforeMin: 0, bufferAfterMin: 10, priceClp: 18000, visibleOnline: true, active: true, sortOrder: 0 },
  { id: "sv-corte-h", categoryId: "c-cabello", name: "Corte hombre", description: "Corte con tijera o máquina.", durationMin: 30, bufferBeforeMin: 0, bufferAfterMin: 5, priceClp: 12000, visibleOnline: true, active: true, sortOrder: 1 },
  { id: "sv-peinado", categoryId: "c-cabello", name: "Peinado de evento", description: "Peinado para matrimonios y eventos.", durationMin: 60, bufferBeforeMin: 0, bufferAfterMin: 10, priceClp: 25000, visibleOnline: true, active: true, sortOrder: 2 },
  { id: "sv-raiz", categoryId: "c-color", name: "Coloración de raíz", description: "Retoque de raíz con tintura profesional.", durationMin: 90, bufferBeforeMin: 0, bufferAfterMin: 15, priceClp: 45000, visibleOnline: true, active: true, sortOrder: 0 },
  { id: "sv-balayage", categoryId: "c-color", name: "Balayage", description: "Iluminación completa con matiz incluido.", durationMin: 150, bufferBeforeMin: 0, bufferAfterMin: 15, priceClp: 85000, visibleOnline: true, active: true, sortOrder: 1 },
  { id: "sv-barba", categoryId: "c-barberia", name: "Perfilado de barba", description: "Perfilado con navaja y toalla caliente.", durationMin: 20, bufferBeforeMin: 0, bufferAfterMin: 5, priceClp: 8000, visibleOnline: true, active: true, sortOrder: 0 },
  { id: "sv-corte-barba", categoryId: "c-barberia", name: "Corte + barba", description: "Servicio completo de barbería.", durationMin: 50, bufferBeforeMin: 0, bufferAfterMin: 10, priceClp: 18000, visibleOnline: true, active: true, sortOrder: 1 },
  { id: "sv-facial", categoryId: "c-estetica", name: "Limpieza facial profunda", description: "Limpieza, exfoliación e hidratación.", durationMin: 60, bufferBeforeMin: 10, bufferAfterMin: 10, priceClp: 30000, visibleOnline: true, active: true, sortOrder: 0 },
  { id: "sv-manicure", categoryId: "c-estetica", name: "Manicure", description: "Manicure tradicional con esmaltado.", durationMin: 45, bufferBeforeMin: 0, bufferAfterMin: 5, priceClp: 14000, visibleOnline: true, active: true, sortOrder: 1 },
];

const staffServices = [
  // Valentina: cabello completo
  { staffId: "s-valentina", serviceId: "sv-corte-m" },
  { staffId: "s-valentina", serviceId: "sv-corte-h" },
  { staffId: "s-valentina", serviceId: "sv-peinado" },
  // Camila: color + cortes de mujer
  { staffId: "s-camila", serviceId: "sv-raiz" },
  { staffId: "s-camila", serviceId: "sv-balayage" },
  { staffId: "s-camila", serviceId: "sv-corte-m" },
  // Martín: barbería
  { staffId: "s-martin", serviceId: "sv-corte-h" },
  { staffId: "s-martin", serviceId: "sv-barba" },
  { staffId: "s-martin", serviceId: "sv-corte-barba" },
  // Josefa: estética
  { staffId: "s-josefa", serviceId: "sv-facial" },
  { staffId: "s-josefa", serviceId: "sv-manicure" },
];

const clients = [
  { id: "cl-1", name: "Antonia Vergara", email: "antonia.v@gmail.com", phone: "+56 9 8811 2233", notes: "Prefiere a Valentina. Alergia al amoníaco.", createdAt: "2026-01-12T10:00:00" },
  { id: "cl-2", name: "Rodrigo Mella", email: "r.mella@outlook.com", phone: "+56 9 7722 3344", notes: "", createdAt: "2026-02-03T15:30:00" },
  { id: "cl-3", name: "Francisca Soto", email: "fran.soto@gmail.com", phone: "+56 9 6633 4455", notes: "Balayage cada 3 meses.", createdAt: "2026-02-20T11:00:00" },
  { id: "cl-4", name: "Diego Aravena", email: "d.aravena@gmail.com", phone: "+56 9 5544 5566", notes: "", createdAt: "2026-03-08T09:00:00" },
  { id: "cl-5", name: "Carolina Núñez", email: "caro.nunez@gmail.com", phone: "+56 9 4455 6677", notes: "Piel sensible: usar línea hipoalergénica.", createdAt: "2026-04-15T14:00:00" },
  { id: "cl-6", name: "Matías Herrera", email: "matias.h@gmail.com", phone: "+56 9 3366 7788", notes: "", createdAt: "2026-05-02T16:00:00" },
  { id: "cl-7", name: "Isidora Campos", email: "isi.campos@gmail.com", phone: "+56 9 2277 8899", notes: "Un no-show en mayo.", createdAt: "2026-05-20T10:30:00" },
  { id: "cl-8", name: "Tomás Guzmán", email: "t.guzman@gmail.com", phone: "+56 9 1188 9900", notes: "", createdAt: "2026-06-10T12:00:00" },
];

interface SeedAppt {
  dayOffset: number;
  time: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  status: AppointmentStatus;
  note?: string;
}

// Citas repartidas en la semana actual (offsets relativos a hoy)
const seedAppts: SeedAppt[] = [
  { dayOffset: 0, time: "10:00", clientId: "cl-1", serviceId: "sv-corte-m", staffId: "s-valentina", status: "confirmada" },
  { dayOffset: 0, time: "11:30", clientId: "cl-4", serviceId: "sv-corte-h", staffId: "s-valentina", status: "confirmada" },
  { dayOffset: 0, time: "10:30", clientId: "cl-3", serviceId: "sv-balayage", staffId: "s-camila", status: "atendida" },
  { dayOffset: 0, time: "11:00", clientId: "cl-2", serviceId: "sv-corte-barba", staffId: "s-martin", status: "confirmada" },
  { dayOffset: 0, time: "15:00", clientId: "cl-5", serviceId: "sv-facial", staffId: "s-josefa", status: "pendiente", note: "Primera visita" },
  { dayOffset: 1, time: "09:30", clientId: "cl-6", serviceId: "sv-corte-h", staffId: "s-martin", status: "confirmada" },
  { dayOffset: 1, time: "12:00", clientId: "cl-7", serviceId: "sv-manicure", staffId: "s-josefa", status: "confirmada" },
  { dayOffset: 1, time: "15:30", clientId: "cl-8", serviceId: "sv-raiz", staffId: "s-camila", status: "confirmada" },
  { dayOffset: 2, time: "10:00", clientId: "cl-5", serviceId: "sv-peinado", staffId: "s-valentina", status: "confirmada" },
  { dayOffset: 2, time: "16:00", clientId: "cl-2", serviceId: "sv-barba", staffId: "s-martin", status: "confirmada" },
  { dayOffset: -1, time: "11:00", clientId: "cl-3", serviceId: "sv-corte-m", staffId: "s-valentina", status: "completada" },
  { dayOffset: -1, time: "15:00", clientId: "cl-7", serviceId: "sv-facial", staffId: "s-josefa", status: "no_show" },
  { dayOffset: -2, time: "12:30", clientId: "cl-8", serviceId: "sv-corte-barba", staffId: "s-martin", status: "completada" },
  { dayOffset: -2, time: "10:00", clientId: "cl-1", serviceId: "sv-raiz", staffId: "s-camila", status: "completada" },
];

// Historial: citas de las últimas 3 semanas para alimentar reportes
// y finanzas. Determinístico (sin aleatoriedad) para que la demo sea estable.
function buildPastAppointments(): Appointment[] {
  const today = new Date();
  const result: Appointment[] = [];
  const times = ["10:00", "11:30", "15:00", "16:30", "12:30"];

  for (let dayOffset = -21; dayOffset <= -3; dayOffset++) {
    const day = addDays(today, dayOffset);
    if (day.getDay() === 0 || day.getDay() === 1) continue; // cerrado dom/lun

    staff.forEach((st, staffIdx) => {
      // Algunos días cada profesional descansa de citas
      if ((dayOffset + staffIdx) % 4 === 0) return;

      const mySvcIds = staffServices
        .filter((ss) => ss.staffId === st.id)
        .map((ss) => ss.serviceId);
      const svc = services.find(
        (s) => s.id === mySvcIds[Math.abs(dayOffset + staffIdx) % mySvcIds.length]
      )!;
      const client = clients[Math.abs(dayOffset * 3 + staffIdx) % clients.length];
      const start = atTime(day, times[(Math.abs(dayOffset) + staffIdx) % times.length]);
      const idx = result.length;
      const status =
        idx % 9 === 0 ? "no_show" : idx % 13 === 0 ? "cancelada" : "completada";

      result.push({
        id: `appt-hist-${dayOffset}-${st.id}`,
        clientId: client.id,
        status,
        origin: idx % 2 === 0 ? "online" : "manual",
        startsAt: toISO(start),
        endsAt: toISO(addMinutes(start, svc.durationMin)),
        totalClp: svc.priceClp,
        createdAt: toISO(addDays(start, -2)),
        items: [
          {
            serviceId: svc.id,
            staffId: st.id,
            startsAt: toISO(start),
            durationMin: svc.durationMin,
            priceClp: svc.priceClp,
          },
        ],
      });
    });
  }
  return result;
}

function buildAppointments(): Appointment[] {
  const today = new Date();
  return seedAppts.map((sa, i) => {
    const svc = services.find((s) => s.id === sa.serviceId)!;
    const start = atTime(addDays(today, sa.dayOffset), sa.time);
    const end = addMinutes(start, svc.durationMin);
    return {
      id: `appt-seed-${i}`,
      clientId: sa.clientId,
      status: sa.status,
      origin: i % 3 === 0 ? "online" : "manual",
      startsAt: toISO(start),
      endsAt: toISO(end),
      totalClp: svc.priceClp,
      clientNote: sa.note,
      createdAt: toISO(addDays(start, -3)),
      items: [
        {
          serviceId: svc.id,
          staffId: sa.staffId,
          startsAt: toISO(start),
          durationMin: svc.durationMin,
          priceClp: svc.priceClp,
        },
      ],
    };
  });
}

export function buildDemoDB(): DB {
  const today = new Date();
  // Bloqueo de ejemplo: almuerzo de Valentina hoy
  const lunchStart = atTime(today, "13:00");
  return {
    business,
    staff,
    schedules,
    blocks: [
      {
        id: "blk-1",
        staffId: "s-valentina",
        startsAt: toISO(lunchStart),
        endsAt: toISO(addMinutes(lunchStart, 60)),
        reason: "Almuerzo",
      },
    ],
    categories,
    services,
    staffServices,
    clients,
    appointments: [...buildPastAppointments(), ...buildAppointments()],
  };
}
