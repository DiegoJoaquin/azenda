"use client";

// Último recurso: errores en el layout raíz (reemplaza <html> completo).

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[global-error]", error.digest ?? "", error);
  return (
    <html lang="es">
      <body style={{ fontFamily: "Georgia, serif", background: "#faf9f6", color: "#1f1d1a" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <h1 style={{ fontSize: 28, margin: 0 }}>Algo salió mal</h1>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: 14, color: "#55514a" }}>
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: 12, padding: "10px 20px", background: "#1f1d1a", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
