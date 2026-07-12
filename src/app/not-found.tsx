import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-serif text-lg text-ink-faint">Azenda</p>
        <h1 className="mt-4 font-serif text-3xl tracking-tight">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          El enlace que seguiste no existe o fue movido.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
