"use client";

import { useMemo, useState } from "react";
import { useDB, updateClientNotes } from "@/lib/store";
import { fmtCLP, fmtDayLong, fmtTime, parseISO } from "@/lib/dates";
import { STATUS_LABEL } from "@/lib/types";
import ImportClientsModal from "@/components/admin/ImportClientsModal";

export default function ClientesPage() {
  const db = useDB();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const clients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...db.clients]
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.clients, query]);

  const selected = db.clients.find((c) => c.id === selectedId) ?? null;
  const history = useMemo(
    () =>
      selected
        ? db.appointments
            .filter((a) => a.clientId === selected.id)
            .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        : [],
    [db.appointments, selected]
  );

  return (
    <div className="flex h-full">
      {/* Lista (en móvil se oculta cuando hay ficha abierta) */}
      <div
        className={`${
          selected ? "hidden md:flex" : "flex"
        } w-full shrink-0 flex-col border-line md:w-96 md:border-r`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line bg-surface px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Clientes</h1>
            <p className="text-sm text-ink-faint">
              {db.clients.length} registrados
            </p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="shrink-0 rounded-md border border-line-strong px-3 py-2 text-sm transition-colors hover:border-sage hover:text-sage"
          >
            ↥ Importar
          </button>
        </header>
        <div className="border-b border-line bg-surface px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono…"
            className="w-full rounded-md border border-line bg-paper px-3.5 py-2 text-sm outline-none placeholder:text-ink-faint/60 focus:border-sage"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {clients.map((c) => {
            const visits = db.appointments.filter(
              (a) => a.clientId === c.id && a.status === "completada"
            ).length;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setDraftNotes(null);
                }}
                className={`block w-full border-b border-line px-6 py-3.5 text-left transition-colors ${
                  selectedId === c.id ? "bg-sage-tint" : "hover:bg-surface"
                }`}
              >
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-ink-faint">
                  {c.phone} · {visits} {visits === 1 ? "visita" : "visitas"}
                </p>
              </button>
            );
          })}
          {clients.length === 0 && query && (
            <p className="px-6 py-10 text-center text-sm text-ink-faint">
              Sin resultados para “{query}”.
            </p>
          )}
          {db.clients.length === 0 && !query && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium">Aún no tienes clientes</p>
              <p className="mx-auto mt-1.5 max-w-[240px] text-xs leading-relaxed text-ink-faint">
                Se agregan solos cuando alguien reserva por tu página, o al crear
                una cita manual. Comparte tu link para recibir la primera.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ficha (en móvil ocupa toda la pantalla) */}
      <div className={`${selected ? "block" : "hidden md:block"} flex-1 overflow-auto`}>
        {!selected ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            Selecciona un cliente para ver su ficha.
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-10">
            <button
              onClick={() => setSelectedId(null)}
              className="mb-4 text-sm text-ink-soft md:hidden"
            >
              ← Volver a clientes
            </button>
            <h2 className="font-serif text-3xl tracking-tight">{selected.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {selected.email} · {selected.phone}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Cliente desde{" "}
              {fmtDayLong(parseISO(selected.createdAt))}
            </p>

            <section className="mt-8">
              <h3 className="text-xs uppercase tracking-widest text-ink-faint">
                Notas internas
              </h3>
              <textarea
                value={draftNotes ?? selected.notes}
                onChange={(e) => setDraftNotes(e.target.value)}
                rows={3}
                placeholder="Preferencias, alergias, fórmulas de color…"
                className="mt-2 w-full rounded-md border border-line bg-surface px-4 py-3 text-sm outline-none placeholder:text-ink-faint/60 focus:border-sage"
              />
              {draftNotes !== null && draftNotes !== selected.notes && (
                <button
                  onClick={() => {
                    updateClientNotes(selected.id, draftNotes);
                    setDraftNotes(null);
                  }}
                  className="mt-2 rounded-md bg-sage px-4 py-2 text-sm text-white transition-colors hover:bg-sage-deep"
                >
                  Guardar notas
                </button>
              )}
            </section>

            <section className="mt-10">
              <h3 className="text-xs uppercase tracking-widest text-ink-faint">
                Historial de citas
              </h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
                {history.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-ink-faint">
                    Aún no tiene citas registradas.
                  </p>
                )}
                {history.map((a) => {
                  const start = parseISO(a.startsAt);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between border-b border-line px-5 py-3.5 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {fmtDayLong(start)} · {fmtTime(start)}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {a.items
                            .map(
                              (it) =>
                                db.services.find((s) => s.id === it.serviceId)
                                  ?.name
                            )
                            .join(" + ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{fmtCLP(a.totalClp)}</p>
                        <p className="text-xs text-ink-faint">
                          {STATUS_LABEL[a.status]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {showImport && <ImportClientsModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
