"use client";

import { useRef, useState } from "react";
import { fileToSquareDataUrl } from "@/lib/image";

// Selector de logo con vista previa circular. Devuelve el logo ya procesado
// (data URL) por onChange, o null si se quita.

export default function LogoUploader({
  value,
  businessName,
  onChange,
}: {
  value?: string;
  businessName: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la imagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const initial = businessName.trim().slice(0, 1).toUpperCase() || "•";

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-sage">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Logo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-white">
            {initial}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-md border border-line-strong px-4 py-2 text-sm transition-colors hover:border-ink disabled:opacity-60"
          >
            {busy ? "Procesando…" : value ? "Cambiar logo" : "Subir logo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm text-ink-faint transition-colors hover:text-danger"
            >
              Quitar
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          JPG o PNG. Se recorta cuadrado automáticamente.
        </p>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
