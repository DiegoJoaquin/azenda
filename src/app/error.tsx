"use client";

// Error boundary global: cualquier excepción no controlada en una página
// cae aquí en vez de dejar la pantalla en blanco.

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Punto único de registro; aquí se conecta Sentry/LogRocket a futuro
    console.error("[error-boundary]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-serif text-lg text-ink-faint">Buuki</p>
        <h1 className="mt-4 font-serif text-3xl tracking-tight">
          Algo salió mal
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Ocurrió un error inesperado. Tus datos están a salvo — puedes
          reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-md border border-line-strong px-5 py-2.5 text-sm transition-colors hover:border-ink"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
