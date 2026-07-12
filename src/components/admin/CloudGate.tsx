"use client";

// Guardián del panel real (/app): exige sesión, exige negocio (si no hay,
// manda al onboarding), carga el snapshot desde Supabase y aplica el
// modelo de acceso: prueba de 7 días → activación manual tras el pago.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  fetchAdminSnapshot,
  fetchMyMembership,
  getSession,
} from "@/lib/cloud";
import { setCloudSnapshot, setMyRole, useDB } from "@/lib/store";
import { isBusinessLocked } from "@/lib/types";
import { whatsappLink, TRIAL_DAYS } from "@/lib/config";

type State = "cargando" | "listo" | "bloqueado";

export default function CloudGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>("cargando");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!session) {
          router.replace("/login");
          return;
        }
        const membership = await fetchMyMembership();
        if (!membership) {
          router.replace("/onboarding");
          return;
        }
        const db = await fetchAdminSnapshot(membership.businessId);
        if (cancelled) return;
        setMyRole(membership.role);
        setCloudSnapshot(db);
        setState(isBusinessLocked(db.business) ? "bloqueado" : "listo");
      } catch (e) {
        console.error("[CloudGate]", e);
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "cargando") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-serif text-xl text-ink-faint">
          Cargando tu negocio…
        </p>
      </div>
    );
  }

  if (state === "bloqueado") return <LockedScreen />;

  return (
    <>
      <TrialBanner />
      {children}
    </>
  );
}

function TrialBanner() {
  const db = useDB();
  const b = db.business;
  if (b.planStatus !== "trial") return null;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(b.trialEndsAt).getTime() - Date.now()) / 86_400_000)
  );
  return (
    <div className="flex items-center justify-center gap-3 border-b border-line bg-clay-tint px-4 py-2 text-sm text-ink-soft">
      <span>
        Prueba gratis: te {daysLeft === 1 ? "queda" : "quedan"}{" "}
        <strong className="text-ink">
          {daysLeft} {daysLeft === 1 ? "día" : "días"}
        </strong>
        .
      </span>
      <a
        href={whatsappLink(
          `Hola, quiero activar mi cuenta de Azenda para "${b.name}".`
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sage hover:underline"
      >
        Activar mi cuenta →
      </a>
    </div>
  );
}

function LockedScreen() {
  const db = useDB();
  const router = useRouter();
  const b = db.business;
  const suspended = b.planStatus === "suspended";

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="font-serif text-lg text-ink-faint">Azenda</p>
        <h1 className="mt-6 font-serif text-4xl tracking-tight">
          {suspended
            ? "Tu cuenta está suspendida"
            : `Tu prueba de ${TRIAL_DAYS} días terminó`}
        </h1>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-ink-soft">
          Tus datos y tu agenda están guardados y a salvo. Para seguir usando
          Azenda con <strong className="text-ink">{b.name}</strong>, escríbenos
          y activamos tu cuenta el mismo día.
        </p>
        <div className="mx-auto mt-8 max-w-sm rounded-lg border border-line bg-surface px-6 py-5 text-left text-sm text-ink-soft">
          <p className="font-medium text-ink">¿Cómo se activa?</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Nos escribes por WhatsApp.</li>
            <li>Te enviamos los datos para transferir tu plan mensual.</li>
            <li>Confirmado el pago, tu cuenta queda activa al instante.</li>
          </ol>
        </div>
        <a
          href={whatsappLink(
            `Hola, quiero activar mi cuenta de Azenda para "${b.name}".`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-md bg-sage px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
        >
          Activar por WhatsApp
        </a>
        <div className="mt-6">
          <button
            onClick={async () => {
              await supabase().auth.signOut();
              router.replace("/login");
            }}
            className="text-sm text-ink-faint hover:text-ink"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
