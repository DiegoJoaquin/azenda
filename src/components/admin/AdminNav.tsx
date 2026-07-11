"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDB } from "@/lib/store";
import { supabase } from "@/lib/supabase";

const NAV = [
  { suffix: "", label: "Agenda", icon: "▤" },
  { suffix: "/clientes", label: "Clientes", icon: "◑" },
  { suffix: "/servicios", label: "Servicios", icon: "✂" },
  { suffix: "/equipo", label: "Equipo", icon: "❖" },
  { suffix: "/finanzas", label: "Finanzas", icon: "◈" },
  { suffix: "/configuracion", label: "Configuración", icon: "◎" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const db = useDB();
  const isDemo = pathname.startsWith("/demo");
  const base = isDemo ? "/demo" : "/app";

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
  );
}
