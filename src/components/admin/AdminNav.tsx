"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDB } from "@/lib/store";

const NAV = [
  { href: "/app", label: "Agenda", icon: "▤" },
  { href: "/app/clientes", label: "Clientes", icon: "◑" },
  { href: "/app/servicios", label: "Servicios", icon: "✂" },
  { href: "/app/equipo", label: "Equipo", icon: "❖" },
  { href: "/app/finanzas", label: "Finanzas", icon: "◈" },
  { href: "/app/configuracion", label: "Configuración", icon: "◎" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const db = useDB();

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-5">
        <Link href="/" className="font-serif text-lg tracking-tight">
          Azenda
        </Link>
        <p className="mt-1 truncate text-xs text-ink-faint">
          {db.business.name}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          Modo demo · los datos viven en este navegador
        </p>
      </div>
    </aside>
  );
}
