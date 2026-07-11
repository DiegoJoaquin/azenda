"use client";

// Los datos de la demo viven en localStorage, que no existe en el servidor.
// Este gate evita el desajuste de hidratación renderizando el subárbol
// solo en el cliente. Al conectar Supabase, desaparece junto con el store.

import { useEffect, useState } from "react";

export default function ClientGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="min-h-screen" />;
  return <>{children}</>;
}
