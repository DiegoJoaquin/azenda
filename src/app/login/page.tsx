"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("Invalid login")
          ? "Correo o contraseña incorrectos."
          : "No pudimos iniciar sesión. Intenta de nuevo."
      );
      return;
    }
    router.replace("/app");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Azenda
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl tracking-tight">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-ink-soft">
            El panel de tu negocio te espera.
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
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">
                Contraseña
              </span>
              <input
                type="password"
                required
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
              className="w-full rounded-md bg-ink py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/registro" className="text-sage hover:underline">
              Crea la tuya gratis
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
