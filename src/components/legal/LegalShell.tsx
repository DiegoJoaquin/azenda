import Link from "next/link";

// Marco visual compartido por Términos y Privacidad: encabezado, navegación
// entre documentos y estilos de prosa consistentes con la marca.

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Azenda
          </Link>
          <nav className="flex gap-5 text-sm text-ink-soft">
            <Link href="/terminos" className="hover:text-ink">Términos</Link>
            <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-ink-faint">
          Última actualización: {updated}
        </p>
        <div className="legal mt-10">{children}</div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-ink-faint">
          <Link href="/" className="hover:text-ink">← Volver al inicio</Link>
        </div>
      </footer>
    </div>
  );
}
