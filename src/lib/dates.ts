// Utilidades de fecha/hora. La demo trabaja en hora local del navegador;
// en producción se trabaja en la zona horaria del negocio.

export function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:00`;
}

export function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s: string): Date {
  return new Date(s);
}

export function atTime(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(base: Date, min: number): Date {
  return new Date(base.getTime() + min * 60_000);
}

export function startOfWeek(base: Date): Date {
  // Semana lunes–domingo
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function sameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

export function fmtTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const WEEKDAYS_LONG = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];
const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function fmtDayLong(d: Date): string {
  return `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function fmtDayShort(d: Date): string {
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()}`;
}

export function fmtMonthYear(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtCLP(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
