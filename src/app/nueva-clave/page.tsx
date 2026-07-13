"use client";

// Fijar nueva contraseña tras el enlace de recuperación. Al llegar desde el
// correo, el cliente de Supabase toma la sesión de recuperación del enlace;
// aquí solo actualizamos la contraseña.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NuevaClavePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // El enlace de recuperación crea una sesión temporal de tipo "recovery".
    const { data: sub } = supabase().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setValid(true);
    });
    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) setValid(true);
        setReady(true);
      });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("No pudimos actualizar la contraseña. Solicita un enlace nuevo.");
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/app"), 1500);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Azenda
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight">
                Contraseña actualizada
              </h1>
              <p className="mt-3 text-sm text-ink-soft">
                Entrando a tu panel…
              </p>
            </div>
          ) : ready && !valid ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight">
                Enlace inválido o vencido
              </h1>
              <p className="mt-3 text-sm text-ink-soft">
                Solicita un enlace nuevo para restablecer tu contraseña.
              </p>
              <Link
                href="/recuperar"
                className="mt-6 inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Pedir enlace nuevo
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl tracking-tight">
                Nueva contraseña
              </h1>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Nueva contraseña (mínimo 8 caracteres)
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-sage"
                  />
                </label>
                {error && (
                  <p className="rounded-md bg-danger-tint px-4 py-2.5 text-sm text-danger">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-sage py-3 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-60"
                >
                  {loading ? "Guardando…" : "Guardar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
