"use client";

// Diálogo de activación de cuenta. Reemplaza al enlace mailto (que dependía
// de tener un cliente de correo configurado y fallaba en Mac/Windows): muestra
// el correo y las instrucciones directamente, con botón de copiar. Ofrece
// abrir el correo como opción secundaria, no como única vía.

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/config";

export default function ActivateDialog({
  businessName,
  onClose,
}: {
  businessName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<"email" | "msg" | null>(null);

  const asunto = `Activar cuenta Azenda — ${businessName}`;
  const mensaje = `Hola, quiero activar mi cuenta de Azenda para "${businessName}". Envíenme los datos para transferir, por favor.`;

  async function copy(text: string, which: "email" | "msg") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback para navegadores/contexto sin clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(which); setTimeout(() => setCopied(null), 2000); } catch {}
      document.body.removeChild(ta);
    }
  }

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;

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
          <h2 className="font-serif text-xl tracking-tight">Activar tu cuenta</h2>
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
            Para activar <strong className="text-ink">{businessName}</strong>,
            escríbenos a este correo y te enviamos los datos para transferir. Una
            vez confirmado el pago, tu cuenta queda activa el mismo día.
          </p>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-ink-faint">
              Escríbenos a
            </span>
            <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
              <span className="flex-1 truncate text-sm font-medium">
                {CONTACT_EMAIL}
              </span>
              <button
                onClick={() => copy(CONTACT_EMAIL, "email")}
                className="shrink-0 rounded-md bg-sage px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sage-deep"
              >
                {copied === "email" ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-ink-faint">
              Mensaje sugerido
            </span>
            <div className="rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft">
              {mensaje}
            </div>
            <button
              onClick={() => copy(mensaje, "msg")}
              className="mt-2 text-xs text-sage hover:underline"
            >
              {copied === "msg" ? "¡Mensaje copiado!" : "Copiar mensaje"}
            </button>
          </div>

          <a
            href={mailto}
            className="mt-6 block rounded-md border border-line-strong py-2.5 text-center text-sm transition-colors hover:border-ink"
          >
            Abrir en mi app de correo
          </a>
          <p className="mt-2 text-center text-xs text-ink-faint">
            Si el botón no abre nada, copia el correo y escríbenos desde Gmail,
            Outlook o donde uses tu correo.
          </p>
        </div>
      </div>
    </div>
  );
}
