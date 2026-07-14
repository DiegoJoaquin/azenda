"use client";

// Calendario mensual para elegir el día de la agenda. Se abre como popover
// bajo el botón de fecha; navega entre meses y resalta hoy y el día activo.

import { useState } from "react";
import { fmtMonthYear, sameDay } from "@/lib/dates";

const WD = ["L", "M", "M", "J", "V", "S", "D"];

export default function DatePicker({
  value,
  onSelect,
  onClose,
}: {
  value: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1)
  );
  const today = new Date();

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  // Semana que empieza en lunes: getDay() 0=dom … convertir a offset lunes
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <>
      {/* Capa para cerrar al hacer clic fuera */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-line bg-surface p-3 shadow-xl">
        <div className="flex items-center justify-between px-1 pb-2">
          <button
            onClick={() => setView(new Date(year, month - 1, 1))}
            className="rounded px-2 py-1 text-ink-soft transition-colors hover:bg-paper"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <span className="text-sm font-medium capitalize">
            {fmtMonthYear(view)}
          </span>
          <button
            onClick={() => setView(new Date(year, month + 1, 1))}
            className="rounded px-2 py-1 text-ink-soft transition-colors hover:bg-paper"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {WD.map((w, i) => (
            <div
              key={i}
              className="py-1 text-center text-[11px] font-medium text-ink-faint"
            >
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const isToday = sameDay(d, today);
            const isActive = sameDay(d, value);
            return (
              <button
                key={i}
                onClick={() => {
                  onSelect(d);
                  onClose();
                }}
                className={`aspect-square rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-sage font-medium text-white"
                    : isToday
                      ? "bg-sage-tint font-medium text-sage-deep"
                      : "hover:bg-paper"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            onSelect(new Date());
            onClose();
          }}
          className="mt-2 w-full rounded-md border border-line py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong"
        >
          Ir a hoy
        </button>
      </div>
    </>
  );
}
