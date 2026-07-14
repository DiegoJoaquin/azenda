"use client";

// Diálogo para compartir la página pública de reservas del negocio.
// Es EL link que el dueño le pasa a sus clientes por WhatsApp, Instagram, etc.

import { useState } from "react";
import { bookingUrl } from "@/lib/config";

export default function ShareBookingDialog({
  slug,
  businessName,
  onClose,
}: {
  slug: string;
  businessName: string;
  onClose: () => void;
}) {
  const url = bookingUrl(slug);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waText = encodeURIComponent(
    `¡Reserva tu hora en ${businessName}! 📅 ${url}`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-xl tracking-tight">
            Tu página de reservas
          </h2>
          <button
            onClick={onClose}
            className="text-ink-faint transition-colors hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-ink-soft">
            Comparte este enlace con tus clientes para que reserven solos, a
            cualquier hora. Ponlo en tu Instagram, WhatsApp o donde te
            encuentren.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-medium">{url}</span>
            <button
              onClick={copy}
              className="shrink-0 rounded-md bg-sage px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sage-deep"
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-line-strong py-2.5 text-center text-sm font-medium transition-colors hover:border-ink"
            >
              Compartir por WhatsApp
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-line-strong py-2.5 text-center text-sm font-medium transition-colors hover:border-ink"
            >
              Ver cómo la ven
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
