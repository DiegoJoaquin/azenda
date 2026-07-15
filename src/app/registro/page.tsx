"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TRIAL_DAYS } from "@/lib/config";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase().auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Ese correo ya tiene una cuenta. Inicia sesión."
          : "No pudimos crear la cuenta. Intenta de nuevo."
      );
      return;
    }
    if (!data.session) {
      // Confirmación por correo activada en Supabase
      setConfirmEmail(true);
      return;
    }
    router.replace("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Buuki
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {confirmEmail ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight">
                Revisa tu correo
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Te enviamos un enlace de confirmación a{" "}
                <strong className="text-ink">{email}</strong>. Ábrelo y luego{" "}
                <Link href="/login" className="text-sage hover:underline">
                  inicia sesión
                </Link>{" "}
                para configurar tu negocio.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl tracking-tight">
                Crea tu cuenta
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                {TRIAL_DAYS} días de prueba, sin tarjeta. En 5 minutos tu
                página de reservas está funcionando.
              </p>

              <form onSubmit={submit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Correo
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-sage"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">
                    Contraseña (mínimo 8 caracteres)
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
                  {loading ? "Creando cuenta…" : "Crear cuenta y configurar mi negocio"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
                Al crear tu cuenta aceptas los{" "}
                <Link href="/terminos" className="text-sage hover:underline">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="text-sage hover:underline">
                  Política de Privacidad
                </Link>
                .
              </p>

              <p className="mt-6 text-center text-sm text-ink-soft">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-sage hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
