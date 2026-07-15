"use client";

// Onboarding: convierte "acepto" en "estoy operando" en 4 pasos.
// El rubro elegido precarga servicios con duración y precio sugeridos;
// la agenda se adapta sola a esas duraciones.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSession,
  fetchMyBusinessId,
  rpcCreateBusiness,
  seedBusinessData,
  cloudUpdateBusiness,
} from "@/lib/cloud";
import { VERTICAL_PRESETS, slugify } from "@/lib/verticals";
import { VERTICAL_LABEL, type Vertical } from "@/lib/types";
import { TRIAL_DAYS } from "@/lib/config";
import { fmtCLP } from "@/lib/dates";
import LogoUploader from "@/components/admin/LogoUploader";

const PALETTE = ["#3f5c4b", "#b0713f", "#3d5568", "#7a5b7d", "#8a6d3b", "#4f6d7a"];

interface SvcRow {
  category: string;
  name: string;
  description: string;
  durationMin: number;
  priceClp: number;
  bufferAfterMin: number;
}

interface StaffRow {
  name: string;
  title: string;
}

interface DayHours {
  weekday: number; // 0 domingo … 6 sábado
  open: boolean;
  start: string;
  end: string;
}

const DAY_LABELS = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

const input =
  "w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-sage";

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  // Paso 1
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [vertical, setVertical] = useState<Vertical>("peluqueria");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Paso 2
  const [services, setServices] = useState<SvcRow[]>([]);
  const [presetFor, setPresetFor] = useState<Vertical | null>(null);

  // Paso 3 — horario por día (cada día puede tener su propio rango)
  const [staff, setStaff] = useState<StaffRow[]>([{ name: "", title: "" }]);
  const [hours, setHours] = useState<DayHours[]>(() =>
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      open: weekday >= 1 && weekday <= 5, // lun–vie por defecto
      start: "09:00",
      end: "18:00",
    }))
  );

  // Paso 4
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [minLead, setMinLead] = useState(60);
  const [cancelHours, setCancelHours] = useState(24);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) {
        router.replace("/registro");
        return;
      }
      const existing = await fetchMyBusinessId();
      if (existing) {
        router.replace("/app");
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  const effectiveSlug = useMemo(
    () => (slugTouched ? slugify(slug) : slugify(name)),
    [slug, slugTouched, name]
  );

  function goToServices() {
    if (!name.trim()) return setError("El nombre del negocio es obligatorio.");
    setError("");
    if (presetFor !== vertical) {
      setServices(
        VERTICAL_PRESETS[vertical].flatMap((cat) =>
          cat.services.map((s) => ({ category: cat.category, ...s }))
        )
      );
      setPresetFor(vertical);
    }
    setStep(2);
  }

  async function create() {
    const validStaff = staff.filter((s) => s.name.trim());
    const openDays = hours.filter((h) => h.open);
    if (services.length === 0) return setError("Agrega al menos un servicio.");
    if (validStaff.length === 0)
      return setError("Agrega al menos un profesional (puedes ser tú).");
    if (openDays.length === 0)
      return setError("Marca al menos un día de atención.");
    for (const h of openDays) {
      if (h.start >= h.end)
        return setError(
          `En ${DAY_LABELS[h.weekday]} la hora de cierre debe ser mayor a la de apertura.`
        );
    }
    const schedule = openDays.map((h) => ({
      weekday: h.weekday,
      start: h.start,
      end: h.end,
    }));

    setCreating(true);
    setError("");
    try {
      const businessId = await rpcCreateBusiness({
        name: name.trim(),
        slug: effectiveSlug,
        vertical,
        description: "",
        phone: phone.trim(),
        address: address.trim(),
      });

      const catNames = [...new Set(services.map((s) => s.category))];
      const categories = catNames.map((n, i) => ({
        id: crypto.randomUUID(),
        name: n,
        sortOrder: i,
      }));
      const catId = new Map(categories.map((c) => [c.name, c.id]));

      const staffRows = validStaff.map((s, i) => ({
        id: crypto.randomUUID(),
        name: s.name.trim(),
        title: s.title.trim() || "Profesional",
        color: PALETTE[i % PALETTE.length],
        bookableOnline: true,
        active: true,
        sortOrder: i,
        schedule, // mismo horario del negocio para cada profesional; se afina luego en Equipo
      }));
      const allStaffIds = staffRows.map((s) => s.id);

      const serviceRows = services.map((s, i) => ({
        id: crypto.randomUUID(),
        categoryId: catId.get(s.category)!,
        name: s.name.trim(),
        description: s.description,
        durationMin: s.durationMin,
        bufferBeforeMin: 0,
        bufferAfterMin: s.bufferAfterMin,
        priceClp: s.priceClp,
        visibleOnline: true,
        active: true,
        sortOrder: i,
        staffIds: allStaffIds, // todos hacen todo; se ajusta luego en Equipo
      }));

      await seedBusinessData(businessId, categories, serviceRows, staffRows);
      cloudUpdateBusiness(businessId, {
        requiresApproval,
        minLeadMinutes: minLead,
        cancellationHours: cancelHours,
        ...(logo ? { logoUrl: logo } : {}),
      });
      router.replace("/app");
    } catch (e) {
      setCreating(false);
      if (e instanceof Error && e.message === "SLUG_TAKEN") {
        setError(
          "Esa dirección web ya está tomada. Cambia el enlace en el paso 1."
        );
        setStep(1);
        setSlugTouched(true);
      } else {
        console.error("[onboarding]", e);
        setError("Algo falló al crear tu negocio. Intenta de nuevo.");
      }
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-serif text-xl text-ink-faint">
          Un momento…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Buuki
          </Link>
          <span className="text-xs text-ink-faint">
            Paso {step} de 4 · prueba gratis de {TRIAL_DAYS} días
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-10">
        {/* ---------- Paso 1: negocio ---------- */}
        {step === 1 && (
          <section>
            <h1 className="font-serif text-3xl tracking-tight">
              Cuéntanos de tu negocio
            </h1>
            <div className="mt-8 space-y-4">
              <div>
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Logo (opcional)
                </span>
                <LogoUploader
                  value={logo ?? undefined}
                  businessName={name}
                  onChange={setLogo}
                />
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Nombre del negocio
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Estudio Mane"
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">Rubro</span>
                <select
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value as Vertical)}
                  className={input}
                >
                  {(Object.keys(VERTICAL_LABEL) as Vertical[]).map((v) => (
                    <option key={v} value={v}>
                      {VERTICAL_LABEL[v]}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-ink-faint">
                  Precargamos servicios típicos de tu rubro; los ajustas en el
                  siguiente paso.
                </span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Teléfono
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 …"
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Dirección
                  </span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, comuna, ciudad"
                    className={input}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">
                  Tu página de reservas
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-faint">buuki.cl/</span>
                  <input
                    value={slugTouched ? slug : effectiveSlug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTouched(true);
                    }}
                    className={input}
                  />
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ---------- Paso 2: servicios ---------- */}
        {step === 2 && (
          <section>
            <h1 className="font-serif text-3xl tracking-tight">Tus servicios</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Sugeridos para {VERTICAL_LABEL[vertical].toLowerCase()}. Edita
              duración y precio, borra lo que no aplique o agrega los tuyos.
            </p>
            <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full min-w-[460px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper text-left text-xs text-ink-faint">
                    <th className="px-4 py-2.5 font-normal">Servicio</th>
                    <th className="w-24 px-2 py-2.5 font-normal">Minutos</th>
                    <th className="w-28 px-2 py-2.5 font-normal">Precio CLP</th>
                    <th className="w-10 px-2 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-4 py-2">
                        <input
                          value={s.name}
                          onChange={(e) =>
                            setServices((p) =>
                              p.map((x, j) =>
                                j === i ? { ...x, name: e.target.value } : x
                              )
                            )
                          }
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={s.durationMin}
                          onChange={(e) =>
                            setServices((p) =>
                              p.map((x, j) =>
                                j === i
                                  ? { ...x, durationMin: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="w-full rounded border border-line bg-paper px-2 py-1 text-sm outline-none focus:border-sage"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={s.priceClp}
                          onChange={(e) =>
                            setServices((p) =>
                              p.map((x, j) =>
                                j === i
                                  ? { ...x, priceClp: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="w-full rounded border border-line bg-paper px-2 py-1 text-sm outline-none focus:border-sage"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() =>
                            setServices((p) => p.filter((_, j) => j !== i))
                          }
                          className="text-ink-faint hover:text-danger"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() =>
                setServices((p) => [
                  ...p,
                  {
                    category: VERTICAL_PRESETS[vertical][0].category,
                    name: "",
                    description: "",
                    durationMin: 30,
                    priceClp: 10000,
                    bufferAfterMin: 5,
                  },
                ])
              }
              className="mt-3 text-sm text-sage hover:underline"
            >
              + Agregar otro servicio
            </button>
          </section>
        )}

        {/* ---------- Paso 3: equipo ---------- */}
        {step === 3 && (
          <section>
            <h1 className="font-serif text-3xl tracking-tight">Tu equipo</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Quiénes atienden y en qué horario. Si trabajas solo, agrégate tú.
              Después podrás afinar horarios y servicios por persona.
            </p>
            <div className="mt-6 space-y-3">
              {staff.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s.name}
                    onChange={(e) =>
                      setStaff((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Nombre y apellido"
                    className={input}
                  />
                  <input
                    value={s.title}
                    onChange={(e) =>
                      setStaff((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Cargo"
                    className={input}
                  />
                  {staff.length > 1 && (
                    <button
                      onClick={() => setStaff((p) => p.filter((_, j) => j !== i))}
                      className="px-2 text-ink-faint hover:text-danger"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStaff((p) => [...p, { name: "", title: "" }])}
              className="mt-3 text-sm text-sage hover:underline"
            >
              + Agregar otra persona
            </button>

            <div className="mt-10">
              <span className="mb-1 block text-sm font-medium text-ink">
                Horario de atención
              </span>
              <p className="mb-3 text-xs text-ink-faint">
                Marca los días que atiendes y define el horario de cada uno. Puedes
                poner un horario distinto por día (por ejemplo, sábados más corto).
              </p>
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                  const h = hours.find((x) => x.weekday === wd)!;
                  const setH = (patch: Partial<DayHours>) =>
                    setHours((p) =>
                      p.map((x) => (x.weekday === wd ? { ...x, ...patch } : x))
                    );
                  return (
                    <div
                      key={wd}
                      className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => setH({ open: !h.open })}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                          h.open
                            ? "border-sage bg-sage text-white"
                            : "border-line-strong text-transparent"
                        }`}
                        aria-label={`Atiende ${DAY_LABELS[wd]}`}
                      >
                        ✓
                      </button>
                      <span
                        className={`w-24 text-sm ${
                          h.open ? "text-ink" : "text-ink-faint"
                        }`}
                      >
                        {DAY_LABELS[wd]}
                      </span>
                      {h.open ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="time"
                            value={h.start}
                            onChange={(e) => setH({ start: e.target.value })}
                            className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-sage"
                          />
                          <span className="text-ink-faint">a</span>
                          <input
                            type="time"
                            value={h.end}
                            onChange={(e) => setH({ end: e.target.value })}
                            className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-sage"
                          />
                        </div>
                      ) : (
                        <span className="flex-1 text-sm text-ink-faint">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  // Copiar el horario del primer día abierto a todos los abiertos
                  const first = hours.find((h) => h.open);
                  if (first)
                    setHours((p) =>
                      p.map((h) =>
                        h.open ? { ...h, start: first.start, end: first.end } : h
                      )
                    );
                }}
                className="mt-3 text-xs text-sage hover:underline"
              >
                Aplicar el mismo horario a todos los días abiertos
              </button>
            </div>
          </section>
        )}

        {/* ---------- Paso 4: políticas y resumen ---------- */}
        {step === 4 && (
          <section>
            <h1 className="font-serif text-3xl tracking-tight">
              Últimos detalles
            </h1>
            <div className="mt-8 space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4 text-sm">
                <span>
                  <span className="block font-medium">Aprobación previa</span>
                  <span className="text-xs text-ink-faint">
                    Cada reserva online queda pendiente hasta que la apruebes
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="h-4 w-4 accent-sage"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Anticipación mínima (minutos)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={minLead}
                    onChange={(e) => setMinLead(Number(e.target.value))}
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Cancelación gratuita hasta (horas)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={cancelHours}
                    onChange={(e) => setCancelHours(Number(e.target.value))}
                    className={input}
                  />
                </label>
              </div>

              <div className="rounded-lg border border-line bg-surface px-5 py-4 text-sm">
                <p className="font-medium">Resumen</p>
                <dl className="mt-2 space-y-1 text-ink-soft">
                  <div className="flex justify-between">
                    <dt>Negocio</dt>
                    <dd>{name} · {VERTICAL_LABEL[vertical]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Página de reservas</dt>
                    <dd>buuki.cl/{effectiveSlug}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Servicios</dt>
                    <dd>
                      {services.length} (desde{" "}
                      {fmtCLP(Math.min(...services.map((s) => s.priceClp)))})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Equipo</dt>
                    <dd>
                      {staff.filter((s) => s.name.trim()).length}{" "}
                      {staff.filter((s) => s.name.trim()).length === 1
                        ? "profesional"
                        : "profesionales"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Atención</dt>
                    <dd className="text-right">
                      {hours.filter((h) => h.open).length === 0
                        ? "sin días definidos"
                        : hours
                            .filter((h) => h.open)
                            .map(
                              (h) =>
                                `${DAY_LABELS[h.weekday].slice(0, 3)} ${h.start}–${h.end}`
                            )
                            .join(", ")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        )}

        {error && (
          <p className="mt-6 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {/* Navegación */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
              className="text-sm text-ink-soft hover:text-ink"
            >
              ← Volver
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 1) return goToServices();
                setError("");
                setStep(step + 1);
              }}
              className="rounded-md bg-ink px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={create}
              disabled={creating}
              className="rounded-md bg-sage px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-60"
            >
              {creating ? "Creando tu negocio…" : "Crear mi negocio 🎉"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
