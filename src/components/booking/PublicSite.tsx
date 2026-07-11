"use client";

// Decide el origen de datos del mini-sitio: la demo usa localStorage;
// cualquier otro slug busca el negocio real en Supabase.

import { useEffect, useState } from "react";
import Link from "next/link";
import BookingSite from "./BookingSite";
import { DEMO_SLUG } from "@/lib/config";
import { ensureDemoMode, setPublicSnapshot } from "@/lib/store";
import { fetchPublicSnapshot } from "@/lib/cloud";

type State = "cargando" | "listo" | "no-encontrado" | "error";

export default function PublicSite({ slug }: { slug: string }) {
  const isDemo = slug === DEMO_SLUG;
  const [state, setState] = useState<State>(isDemo ? "listo" : "cargando");

  if (isDemo) ensureDemoMode();

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    fetchPublicSnapshot(slug)
      .then((db) => {
        if (cancelled) return;
        if (!db) {
          setState("no-encontrado");
        } else {
          setPublicSnapshot(db);
          setState("listo");
        }
      })
      .catch((e) => {
        console.error("[PublicSite]", e);
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isDemo]);

  if (state === "cargando") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-serif text-xl text-ink-faint">
          Cargando…
        </p>
      </div>
    );
  }

  if (state === "no-encontrado") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="font-serif text-3xl">Negocio no encontrado</p>
          <p className="mt-2 text-ink-soft">
            Revisa el enlace, o mira la{" "}
            <Link href={`/${DEMO_SLUG}`} className="text-sage underline">
              demo
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-ink-soft">
          No pudimos cargar la página. Intenta recargar.
        </p>
      </div>
    );
  }

  return <BookingSite slug={slug} />;
}
