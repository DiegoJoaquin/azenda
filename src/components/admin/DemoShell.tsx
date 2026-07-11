"use client";

// Envoltorio de las rutas /demo: fuerza el modo demo (localStorage) y
// muestra una barra que invita a crear la cuenta real.

import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { ensureDemoMode } from "@/lib/store";

export default function DemoShell({
  children,
}: {
  children: React.ReactNode;
}) {
  ensureDemoMode();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-center gap-3 border-b border-line bg-sage-tint px-4 py-2 text-sm text-ink-soft">
        <span>
          Estás explorando la <strong className="text-ink">demo</strong> con
          datos de ejemplo.
        </span>
        <Link href="/registro" className="font-medium text-sage hover:underline">
          Crea tu cuenta real →
        </Link>
      </div>
      <div className="flex min-h-0 flex-1">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
