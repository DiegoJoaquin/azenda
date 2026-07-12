"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDB, useMyRole } from "@/lib/store";
import { supabase } from "@/lib/supabase";

const NAV = [
  { suffix: "", label: "Agenda", icon: "▤", adminOnly: false },
  { suffix: "/clientes", label: "Clientes", icon: "◑", adminOnly: false },
  { suffix: "/servicios", label: "Servicios", icon: "✂", adminOnly: false },
  { suffix: "/equipo", label: "Equipo", icon: "❖", adminOnly: false },
  { suffix: "/finanzas", label: "Finanzas", icon: "◈", adminOnly: true },
  { suffix: "/configuracion", label: "Configuración", icon: "◎", adminOnly: true },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const db = useDB();
  const role = useMyRole();
  const isDemo = pathname.startsWith("/demo");
  const base = isDemo ? "/demo" : "/app";
  // RBAC de interfaz: el rol "staff" no ve finanzas ni configuración
  // (el enforcement duro está en las políticas RLS de la base).
  const nav = NAV.filter((item) => !item.adminOnly || role !== "staff");

  return (
    <>
      {/* Barra inferior (móvil): patrón de app nativa */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {nav.map((item) => {
          const href = `${base}${item.suffix}`;
          const active =
            item.suffix === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                active ? "font-medium text-sage-deep" : "text-ink-faint"
              }`}
            >
              <span className="text-sm leading-none">{item.icon}</span>
              {item.label === "Configuración" ? "Ajustes" : item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar (escritorio) */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="border-b border-line px-5 py-5">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Azenda
        </Link>
        <p className="mt-1 truncate text-xs text-ink-faint">
          {db.business.name}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map((item) => {
          const href = `${base}${item.suffix}`;
          const active =
            item.suffix === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-sage-tint font-medium text-sage-deep"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              <span className="w-4 text-center text-xs opacity-70">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <Link
          href={`/${db.business.slug}`}
          className="block text-xs text-sage hover:underline"
        >
          Ver mi página de reservas →
        </Link>
        {isDemo ? (
          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            Modo demo · los datos viven en este navegador
          </p>
        ) : (
          <button
            onClick={async () => {
              await supabase().auth.signOut();
              router.replace("/login");
            }}
            className="mt-2 text-[11px] text-ink-faint transition-colors hover:text-ink"
          >
            Cerrar sesión
          </button>
        )}
      </div>
      </aside>
    </>
  );
}
