"use client";

// Importar clientes desde un archivo CSV (exportado de AgendaPro, Reservo,
// Excel, etc.). Detecta las columnas solas, deja ajustar el mapeo, muestra una
// vista previa y omite duplicados.

import { useMemo, useRef, useState } from "react";
import { parseCsv, detectMapping, type ClientField } from "@/lib/csv";
import { importClients } from "@/lib/store";

type Mapping = Record<ClientField, number>;

const FIELD_LABEL: Record<ClientField, string> = {
  name: "Nombre",
  phone: "Teléfono",
  email: "Correo",
  rut: "RUT",
  notes: "Notas",
};
const FIELD_ORDER: ClientField[] = ["name", "phone", "email", "rut", "notes"];

export default function ImportClientsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
      } catch {
        // Excel en español suele guardar en Windows-1252 (Latin-1)
        text = new TextDecoder("windows-1252").decode(buf);
      }
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setError("El archivo está vacío o no se pudo leer. ¿Es un CSV con encabezados?");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(detectMapping(parsed.headers));
    } catch {
      setError("No pudimos leer el archivo. Asegúrate de que sea un CSV.");
    }
  }

  // Construye las filas de cliente según el mapeo actual
  const preview = useMemo(() => {
    if (!mapping) return [];
    const at = (row: string[], idx: number) => (idx >= 0 ? (row[idx] ?? "").trim() : "");
    return rows.map((row) => {
      const rut = at(row, mapping.rut);
      const baseNotes = at(row, mapping.notes);
      const notes = [baseNotes, rut ? `RUT: ${rut}` : ""].filter(Boolean).join(" · ");
      return {
        name: at(row, mapping.name),
        phone: at(row, mapping.phone),
        email: at(row, mapping.email),
        notes,
      };
    });
  }, [rows, mapping]);

  const validRows = preview.filter((r) => r.name);

  function doImport() {
    setBusy(true);
    const res = importClients(validRows);
    setBusy(false);
    setResult(res);
  }

  const showMapper = mapping && !result;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-xl tracking-tight">Importar clientes</h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition-colors hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Resultado final */}
          {result ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage text-xl text-white">
                ✓
              </div>
              <p className="mt-4 font-serif text-2xl tracking-tight">
                {result.added} {result.added === 1 ? "cliente importado" : "clientes importados"}
              </p>
              {result.skipped > 0 && (
                <p className="mt-1 text-sm text-ink-faint">
                  {result.skipped} se omitieron (ya existían o sin nombre).
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-6 rounded-md bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Listo
              </button>
            </div>
          ) : !mapping ? (
            /* Paso 1: subir archivo */
            <div className="text-center">
              <p className="text-sm leading-relaxed text-ink-soft">
                Sube la base de clientes de tu sistema anterior en formato{" "}
                <strong className="text-ink">CSV</strong>. Si la tienes en Excel,
                ábrela y usa <em>Guardar como → CSV</em>.
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-6 rounded-md bg-sage px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
              >
                Elegir archivo CSV
              </button>
              <p className="mt-3 text-xs text-ink-faint">
                Reconocemos solas las columnas de nombre, teléfono, correo y RUT.
              </p>
              {error && (
                <p className="mt-4 rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>
          ) : (
            /* Paso 2: mapear columnas + preview */
            showMapper && (
              <>
                <p className="text-sm text-ink-soft">
                  Detectamos {rows.length}{" "}
                  {rows.length === 1 ? "fila" : "filas"}. Revisa que cada dato
                  apunte a la columna correcta:
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {FIELD_ORDER.map((field) => (
                    <label key={field} className="block">
                      <span className="mb-1 block text-sm text-ink-soft">
                        {FIELD_LABEL[field]}
                        {field === "name" && (
                          <span className="text-danger"> *</span>
                        )}
                      </span>
                      <select
                        value={mapping[field]}
                        onChange={(e) =>
                          setMapping({ ...mapping, [field]: Number(e.target.value) })
                        }
                        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-sage"
                      >
                        <option value={-1}>(ninguna)</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `Columna ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {/* Vista previa */}
                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-ink-faint">
                    Vista previa
                  </p>
                  <div className="overflow-x-auto rounded-md border border-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-paper text-left text-xs text-ink-faint">
                          <th className="px-3 py-2 font-normal">Nombre</th>
                          <th className="px-3 py-2 font-normal">Teléfono</th>
                          <th className="px-3 py-2 font-normal">Correo</th>
                          <th className="px-3 py-2 font-normal">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 4).map((r, i) => (
                          <tr key={i} className="border-b border-line last:border-0">
                            <td className="px-3 py-2">{r.name || <span className="text-danger">—</span>}</td>
                            <td className="px-3 py-2 text-ink-soft">{r.phone}</td>
                            <td className="px-3 py-2 text-ink-soft">{r.email}</td>
                            <td className="px-3 py-2 text-ink-faint">{r.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {mapping.name === -1 && (
                  <p className="mt-3 rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
                    Elige qué columna tiene el nombre del cliente (es obligatorio).
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMapping(null);
                      setRows([]);
                      setHeaders([]);
                    }}
                    className="text-sm text-ink-soft hover:text-ink"
                  >
                    ← Elegir otro archivo
                  </button>
                  <button
                    onClick={doImport}
                    disabled={busy || mapping.name === -1 || validRows.length === 0}
                    className="rounded-md bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Importar {validRows.length}{" "}
                    {validRows.length === 1 ? "cliente" : "clientes"}
                  </button>
                </div>
              </>
            )
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
