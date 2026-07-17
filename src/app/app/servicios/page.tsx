"use client";

import { useState } from "react";
import { useDB, addService, setServiceActive } from "@/lib/store";
import { fmtCLP, fmtDuration } from "@/lib/dates";
import { terms } from "@/lib/terms";

export default function ServiciosPage() {
  const db = useDB();
  const t = terms(db.business.vertical);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-4 md:px-8">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Servicios</h1>
          <p className="text-sm text-ink-faint">
            Catálogo visible en tu página de reservas
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md bg-sage px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
        >
          + Agregar servicio
        </button>
      </header>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-6 md:px-8 md:py-10">
        {db.categories
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((cat) => {
            const services = db.services
              .filter((s) => s.categoryId === cat.id)
              .sort((a, b) =>
                a.active === b.active ? a.sortOrder - b.sortOrder : a.active ? -1 : 1
              );
            if (services.length === 0) return null;
            return (
              <section key={cat.id}>
                <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-ink-faint">
                  {cat.name}
                </h2>
                <div className="overflow-x-auto rounded-lg border border-line bg-surface">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-line bg-paper text-left text-xs text-ink-faint">
                        <th className="px-5 py-2.5 font-normal">Servicio</th>
                        <th className="px-4 py-2.5 font-normal">Duración</th>
                        <th className="px-4 py-2.5 font-normal">Precio</th>
                        <th className="px-4 py-2.5 font-normal">{t.section}</th>
                        <th className="px-4 py-2.5 font-normal">Estado</th>
                        <th className="px-5 py-2.5 text-right font-normal"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s) => {
                        const pros = db.staffServices
                          .filter((ss) => ss.serviceId === s.id)
                          .map((ss) =>
                            db.staff.find(
                              (st) => st.id === ss.staffId && st.active
                            )?.name.split(" ")[0]
                          )
                          .filter(Boolean);
                        return (
                          <tr
                            key={s.id}
                            className={`border-b border-line last:border-0 hover:bg-paper ${
                              !s.active ? "opacity-50" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-ink-faint">{s.description}</p>
                            </td>
                            <td className="px-4 py-3.5 text-ink-soft">
                              {fmtDuration(s.durationMin)}
                              {s.bufferAfterMin > 0 && (
                                <span className="block text-xs text-ink-faint">
                                  +{s.bufferAfterMin}′ buffer
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">{fmtCLP(s.priceClp)}</td>
                            <td className="px-4 py-3.5 text-xs text-ink-soft">
                              {pros.join(", ") || "—"}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${
                                  s.active
                                    ? "bg-sage-tint text-sage-deep"
                                    : "bg-paper text-ink-faint"
                                }`}
                              >
                                {s.active ? "Activo" : "Retirado"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {s.active ? (
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `¿Quitar "${s.name}" del catálogo? Dejará de ofrecerse online y en citas nuevas. Su historial se conserva.`
                                      )
                                    )
                                      setServiceActive(s.id, false);
                                  }}
                                  className="text-xs text-ink-faint transition-colors hover:text-danger"
                                >
                                  Quitar
                                </button>
                              ) : (
                                <button
                                  onClick={() => setServiceActive(s.id, true)}
                                  className="text-xs text-sage hover:underline"
                                >
                                  Reactivar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
      </div>

      {showAdd && <AddServiceModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddServiceModal({ onClose }: { onClose: () => void }) {
  const db = useDB();
  const t = terms(db.business.vertical);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(db.categories[0]?.id ?? "");
  const [duration, setDuration] = useState(45);
  const [buffer, setBuffer] = useState(0);
  const [price, setPrice] = useState(15000);
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [visibleOnline, setVisibleOnline] = useState(true);
  const [error, setError] = useState("");

  function save() {
    if (!name.trim()) return setError("El nombre es obligatorio.");
    if (duration < 5) return setError("La duración mínima es de 5 minutos.");
    if (staffIds.length === 0)
      return setError(`Asigna al menos una ${t.resource}.`);
    addService(
      {
        categoryId,
        name: name.trim(),
        description: description.trim(),
        durationMin: duration,
        bufferBeforeMin: 0,
        bufferAfterMin: buffer,
        priceClp: price,
        visibleOnline,
      },
      staffIds
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-xl tracking-tight">Agregar servicio</h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del servicio"
            className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción breve (la ve el cliente)"
            className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
          />

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Categoría</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
              >
                {db.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">
                Precio (CLP)
              </span>
              <input
                type="number"
                min={0}
                step={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">
                Duración (minutos)
              </span>
              <input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
              />
              <span className="mt-1 block text-xs text-ink-faint">
                La agenda y las horas online se adaptan a esta duración.
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">
                Buffer posterior (min)
              </span>
              <input
                type="number"
                min={0}
                step={5}
                value={buffer}
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-sage"
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Tiempo de limpieza/preparación entre citas.
              </span>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-ink-soft">
              {t.ResourceCap === "Cancha"
                ? "Canchas donde está disponible"
                : "Profesionales que lo realizan"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {db.staff
                .filter((st) => st.active)
                .map((st) => (
                  <button
                    key={st.id}
                    onClick={() =>
                      setStaffIds((p) =>
                        p.includes(st.id)
                          ? p.filter((x) => x !== st.id)
                          : [...p, st.id]
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      staffIds.includes(st.id)
                        ? "border-sage bg-sage-tint"
                        : "border-line bg-paper text-ink-soft"
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={visibleOnline}
              onChange={(e) => setVisibleOnline(e.target.checked)}
              className="accent-sage"
            />
            Visible en la página de reservas online
          </label>

          {error && (
            <p className="rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-line-strong px-5 py-2.5 text-sm transition-colors hover:border-ink"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="rounded-md bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
          >
            Agregar servicio
          </button>
        </div>
      </div>
    </div>
  );
}
