"use client";

// Solicitud de recuperación de contraseña. Usa el correo de auth propio de
// Supabase (no depende de Resend). El enlace del correo lleva a /nueva-clave.

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Se responde igual haya o no cuenta, para no revelar qué correos existen.
    await supabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nueva-clave`,
    });
    setLoading(false);
    setSent(true);
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
          {sent ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl tracking-tight">
                Revisa tu correo
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Si <strong className="text-ink">{email}</strong> tiene una cuenta,
                te enviamos un enlace para crear una nueva contraseña. Revisa
                también tu carpeta de spam.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-sage hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-3xl tracking-tight">
                Recuperar contraseña
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">Correo</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-sage"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-ink py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
                >
                  {loading ? "Enviando…" : "Enviar enlace"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-ink-soft">
                <Link href="/login" className="text-sage hover:underline">
                  ← Volver
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
