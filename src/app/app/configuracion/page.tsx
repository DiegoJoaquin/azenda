"use client";

import { useState } from "react";
import Link from "next/link";
import { useDB, updateBusiness, resetDemo } from "@/lib/store";
import { VERTICAL_LABEL } from "@/lib/types";

export default function ConfiguracionPage() {
  const db = useDB();
  const b = db.business;

  const [draft, setDraft] = useState({
    name: b.name,
    description: b.description,
    phone: b.phone,
    address: b.address,
    requiresApproval: b.requiresApproval,
    minLeadMinutes: b.minLeadMinutes,
    maxLeadDays: b.maxLeadDays,
    cancellationHours: b.cancellationHours,
    slotGranularityMin: b.slotGranularityMin,
  });
  const [saved, setSaved] = useState(false);

  const dirty =
    draft.name !== b.name ||
    draft.description !== b.description ||
    draft.phone !== b.phone ||
    draft.address !== b.address ||
    draft.requiresApproval !== b.requiresApproval ||
    draft.minLeadMinutes !== b.minLeadMinutes ||
    draft.maxLeadDays !== b.maxLeadDays ||
    draft.cancellationHours !== b.cancellationHours ||
    draft.slotGranularityMin !== b.slotGranularityMin;

  function save() {
    if (!draft.name.trim()) return;
    updateBusiness({
      ...draft,
      name: draft.name.trim(),
      minLeadMinutes: Math.max(0, draft.minLeadMinutes),
      maxLeadDays: Math.max(1, draft.maxLeadDays),
      cancellationHours: Math.max(0, draft.cancellationHours),
      slotGranularityMin: Math.max(5, draft.slotGranularityMin),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const input =
    "w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-surface px-8 py-4">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Configuración</h1>
          <p className="text-sm text-ink-faint">
            Los cambios se reflejan al instante en tu página de reservas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-sage">✓ Guardado</span>}
          <button
            onClick={save}
            disabled={!dirty}
            className="rounded-md bg-sage px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-30"
          >
            Guardar cambios
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-8 py-10">
        {/* Datos del negocio */}
        <section className="overflow-hidden rounded-lg border border-line bg-surface">
          <h2 className="border-b border-line bg-paper px-6 py-3 text-xs uppercase tracking-widest text-ink-faint">
            Negocio
          </h2>
          <div className="space-y-4 px-6 py-5">
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Nombre</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className={input}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">
                Descripción (la ve el cliente en tu página)
              </span>
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                rows={2}
                className={input}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">Teléfono</span>
                <input
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, phone: e.target.value }))
                  }
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">Rubro</span>
                <input
                  value={VERTICAL_LABEL[b.vertical]}
                  disabled
                  className={`${input} opacity-60`}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Dirección</span>
              <input
                value={draft.address}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, address: e.target.value }))
                }
                className={input}
              />
            </label>
            <p className="text-xs text-ink-faint">
              Tu página de reservas:{" "}
              <Link href={`/${b.slug}`} className="text-sage hover:underline">
                azenda.cl/{b.slug}
              </Link>
            </p>
          </div>
        </section>

        {/* Políticas de reserva */}
        <section className="overflow-hidden rounded-lg border border-line bg-surface">
          <h2 className="border-b border-line bg-paper px-6 py-3 text-xs uppercase tracking-widest text-ink-faint">
            Políticas de reserva online
          </h2>
          <div className="space-y-4 px-6 py-5">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="block font-medium">Aprobación previa</span>
                <span className="text-xs text-ink-faint">
                  Cada reserva online queda pendiente hasta que la apruebes
                </span>
              </span>
              <input
                type="checkbox"
                checked={draft.requiresApproval}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, requiresApproval: e.target.checked }))
                }
                className="h-4 w-4 accent-sage"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Anticipación mínima (minutos)
                </span>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={draft.minLeadMinutes}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      minLeadMinutes: Number(e.target.value),
                    }))
                  }
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Ventana máxima (días)
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.maxLeadDays}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, maxLeadDays: Number(e.target.value) }))
                  }
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Cancelación gratuita hasta (horas antes)
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.cancellationHours}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      cancellationHours: Number(e.target.value),
                    }))
                  }
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Grilla de horarios (minutos)
                </span>
                <select
                  value={draft.slotGranularityMin}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      slotGranularityMin: Number(e.target.value),
                    }))
                  }
                  className={input}
                >
                  {[10, 15, 20, 30, 60].map((g) => (
                    <option key={g} value={g}>
                      cada {g} minutos
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        {/* Demo */}
        <section className="rounded-lg border border-line bg-surface px-6 py-5">
          <h2 className="text-sm font-medium">Datos de demostración</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Esta demo guarda todo en tu navegador. Puedes volver al estado
            inicial cuando quieras.
          </p>
          <button
            onClick={() => {
              if (confirm("¿Restablecer todos los datos de la demo?")) resetDemo();
            }}
            className="mt-4 rounded-md border border-line-strong px-4 py-2 text-sm text-ink-soft transition-colors hover:border-danger hover:text-danger"
          >
            Restablecer demo
          </button>
        </section>
      </div>
    </div>
  );
}
