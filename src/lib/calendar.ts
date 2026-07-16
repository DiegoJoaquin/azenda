// Helpers para que el cliente final agregue su cita a su calendario.
// Sin backend: se genera un enlace de Google Calendar y un archivo .ics
// (Apple Calendar, Outlook) en el navegador.

import type { Appointment } from "./types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Formato de fecha "flotante" YYYYMMDDTHHMMSS (hora local del negocio/cliente)
function fmtCal(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

interface CalInfo {
  businessName: string;
  address: string;
  serviceNames: string[];
}

export function googleCalendarUrl(appt: Appointment, info: CalInfo): string {
  const title = `${info.serviceNames.join(" + ")} — ${info.businessName}`;
  const details = `Reserva en ${info.businessName}. Servicios: ${info.serviceNames.join(", ")}.`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmtCal(appt.startsAt)}/${fmtCal(appt.endsAt)}`,
    details,
    location: info.address,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsDataUrl(appt: Appointment, info: CalInfo): string {
  const title = `${info.serviceNames.join(" + ")} — ${info.businessName}`;
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Buuki//Reservas//ES",
    "BEGIN:VEVENT",
    `UID:${appt.id}@buuki.cl`,
    `DTSTART:${fmtCal(appt.startsAt)}`,
    `DTEND:${fmtCal(appt.endsAt)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(info.address)}`,
    `DESCRIPTION:${esc(`Reserva en ${info.businessName}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
