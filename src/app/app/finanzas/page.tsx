"use client";

// Finanzas: ingresos reales (citas completadas), proyección de la semana,
// pérdidas por inasistencia y desglose por profesional y servicio.

import { useMemo, useState } from "react";
import { useDB } from "@/lib/store";
import {
  addDays,
  dateKey,
  fmtCLP,
  fmtDayLong,
  fmtDayShort,
  parseISO,
  sameDay,
  startOfWeek,
} from "@/lib/dates";

type PeriodMode = "dia" | "semana" | "mes";

export default function FinanzasPage() {
  const db = useDB();
  const today = new Date();
  const [mode, setMode] = useState<PeriodMode>("dia");
  const [pickedDate, setPickedDate] = useState(dateKey(today));

  // Consulta por período: día, semana (lun–dom) o mes de la fecha elegida
  const consulta = useMemo(() => {
    const [y, mo, d] = pickedDate.split("-").map(Number);
    const base = new Date(y, mo - 1, d);
    let from: Date, to: Date, label: string;
    if (mode === "dia") {
      from = new Date(base);
      from.setHours(0, 0, 0, 0);
      to = addDays(from, 1);
      label = fmtDayLong(base);
    } else if (mode === "semana") {
      from = startOfWeek(base);
      to = addDays(from, 7);
      label = `semana del ${from.getDate()} al ${addDays(from, 6).getDate()}`;
    } else {
      from = new Date(base.getFullYear(), base.getMonth(), 1);
      to = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      label = `mes de ${from.toLocaleDateString("es-CL", { month: "long" })}`;
    }
    const citas = db.appointments.filter((a) => {
      const dd = parseISO(a.startsAt);
      return a.status === "completada" && dd >= from && dd < to;
    });
    const total = citas.reduce((s, a) => s + a.totalClp, 0);
    return { label, total, count: citas.length };
  }, [db, mode, pickedDate]);

  const m = useMemo(() => {
    const completed = db.appointments.filter((a) => a.status === "completada");
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const sum = (list: typeof completed) =>
      list.reduce((s, a) => s + a.totalClp, 0);

    const hoy = sum(completed.filter((a) => sameDay(parseISO(a.startsAt), today)));
    const semana = sum(
      completed.filter((a) => {
        const d = parseISO(a.startsAt);
        return d >= addDays(today, -6) && d <= addDays(today, 1);
      })
    );
    const mes = sum(completed.filter((a) => parseISO(a.startsAt) >= monthStart));

    const completadasMes = completed.filter(
      (a) => parseISO(a.startsAt) >= monthStart
    ).length;
    const ticketPromedio = completadasMes > 0 ? Math.round(mes / completadasMes) : 0;

    const perdidoNoShow = sum(
      db.appointments.filter(
        (a) => a.status === "no_show" && parseISO(a.startsAt) >= monthStart
      ) as typeof completed
    );

    // Proyección: citas activas de los próximos 7 días
    const proyectado = db.appointments
      .filter((a) => {
        const d = parseISO(a.startsAt);
        return (
          ["pendiente", "confirmada", "atendida"].includes(a.status) &&
          d >= today &&
          d <= addDays(today, 7)
        );
      })
      .reduce((s, a) => s + a.totalClp, 0);

    // Serie diaria: últimos 14 días
    const serie = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i - 13);
      return {
        day: d,
        total: sum(completed.filter((a) => sameDay(parseISO(a.startsAt), d))),
      };
    });
    const maxSerie = Math.max(...serie.map((s) => s.total), 1);

    // Desglose por profesional (mes actual, por ítem)
    const porStaff = db.staff
      .map((st) => {
        let total = 0;
        for (const a of completed) {
          if (parseISO(a.startsAt) < monthStart) continue;
          for (const it of a.items) {
            if (it.staffId === st.id) total += it.priceClp;
          }
        }
        return { staff: st, total };
      })
      .sort((a, b) => b.total - a.total);
    const maxStaff = Math.max(...porStaff.map((s) => s.total), 1);

    // Top servicios del mes
    const svcTotals = new Map<string, { total: number; count: number }>();
    for (const a of completed) {
      if (parseISO(a.startsAt) < monthStart) continue;
      for (const it of a.items) {
        const cur = svcTotals.get(it.serviceId) ?? { total: 0, count: 0 };
        cur.total += it.priceClp;
        cur.count += 1;
        svcTotals.set(it.serviceId, cur);
      }
    }
    const porServicio = [...svcTotals.entries()]
      .map(([id, v]) => ({
        service: db.services.find((s) => s.id === id)!,
        ...v,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      hoy, semana, mes, ticketPromedio, completadasMes,
      perdidoNoShow, proyectado, serie, maxSerie, porStaff, maxStaff, porServicio,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface px-4 py-4 md:px-8">
        <h1 className="font-serif text-2xl tracking-tight">Finanzas</h1>
        <p className="text-sm text-ink-faint">
          Ingresos por citas completadas · pago en el local
        </p>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        {/* Indicadores principales */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
          <Kpi label="Hoy" value={fmtCLP(m.hoy)} />
          <Kpi label="Últimos 7 días" value={fmtCLP(m.semana)} />
          <Kpi label="Este mes" value={fmtCLP(m.mes)} sub={`${m.completadasMes} citas · ticket ${fmtCLP(m.ticketPromedio)}`} />
          <Kpi
            label="Agendado próximos 7 días"
            value={fmtCLP(m.proyectado)}
            accent
          />
        </div>

        {/* Consulta por período */}
        <section className="rounded-lg border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium">Consultar período</h2>
              <p className="text-xs text-ink-faint">
                Ingresos de citas completadas y cobradas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex overflow-hidden rounded-md border border-line">
                {(
                  [
                    ["dia", "Día"],
                    ["semana", "Semana"],
                    ["mes", "Mes"],
                  ] as [PeriodMode, string][]
                ).map(([m2, label]) => (
                  <button
                    key={m2}
                    onClick={() => setMode(m2)}
                    className={`px-4 py-2 text-sm transition-colors ${
                      mode === m2
                        ? "bg-ink text-white"
                        : "bg-paper text-ink-soft hover:bg-surface"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={pickedDate}
                onChange={(e) => setPickedDate(e.target.value)}
                className="rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none focus:border-sage"
              />
            </div>
          </div>
          <div className="mt-5 flex items-baseline justify-between rounded-md bg-paper px-5 py-4">
            <span className="text-sm capitalize text-ink-soft">
              {consulta.label} · {consulta.count}{" "}
              {consulta.count === 1 ? "cita cobrada" : "citas cobradas"}
            </span>
            <span className="font-serif text-3xl tabular-nums">
              {fmtCLP(consulta.total)}
            </span>
          </div>
        </section>

        {/* Gráfico de barras: últimos 14 días */}
        <section className="rounded-lg border border-line bg-surface p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Ingresos diarios</h2>
            <span className="text-xs text-ink-faint">últimos 14 días</span>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {m.serie.map(({ day, total }) => (
              <div
                key={day.toISOString()}
                className="group flex flex-1 flex-col items-center gap-2"
                title={`${fmtDayShort(day)}: ${fmtCLP(total)}`}
              >
                <span className="text-[10px] tabular-nums text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                  {total > 0 ? `$${Math.round(total / 1000)}k` : ""}
                </span>
                <div
                  className={`w-full rounded-t transition-colors ${
                    sameDay(day, today)
                      ? "bg-sage"
                      : total > 0
                        ? "bg-sage/35 group-hover:bg-sage/60"
                        : "bg-line"
                  }`}
                  style={{
                    height: `${Math.max((total / m.maxSerie) * 130, 3)}px`,
                  }}
                />
                <span className="text-[10px] text-ink-faint">
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Por profesional */}
          <section className="rounded-lg border border-line bg-surface p-6">
            <h2 className="text-sm font-medium">Por profesional (este mes)</h2>
            <div className="mt-5 space-y-4">
              {m.porStaff.map(({ staff, total }) => (
                <div key={staff.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{staff.name}</span>
                    <span className="tabular-nums text-ink-soft">
                      {fmtCLP(total)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(total / m.maxStaff) * 100}%`,
                        backgroundColor: staff.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top servicios */}
          <section className="rounded-lg border border-line bg-surface p-6">
            <h2 className="text-sm font-medium">Servicios más vendidos (este mes)</h2>
            <div className="mt-4">
              {m.porServicio.map(({ service, total, count }, i) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between border-b border-line py-3 text-sm last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 font-serif text-ink-faint">{i + 1}</span>
                    <div>
                      <p>{service.name}</p>
                      <p className="text-xs text-ink-faint">
                        {count} {count === 1 ? "cita" : "citas"}
                      </p>
                    </div>
                  </div>
                  <span className="tabular-nums text-ink-soft">
                    {fmtCLP(total)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Pérdidas por inasistencia */}
        <section className="flex items-center justify-between rounded-lg border border-line bg-danger-tint/50 px-6 py-4">
          <div>
            <p className="text-sm font-medium">
              Perdido por inasistencias este mes
            </p>
            <p className="text-xs text-ink-soft">
              Activa los anticipos al reservar para protegerte de los no-show.
            </p>
          </div>
          <span className="font-serif text-2xl text-danger">
            {fmtCLP(m.perdidoNoShow)}
          </span>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`px-6 py-6 ${accent ? "bg-sage-tint" : "bg-surface"}`}>
      <p className="text-xs uppercase tracking-widest text-ink-faint">{label}</p>
      <p className="mt-2 font-serif text-2xl tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}
