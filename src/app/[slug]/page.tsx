import type { Metadata } from "next";
import PublicSite from "@/components/booking/PublicSite";
import ClientGate from "@/components/ClientGate";
import { SITE_URL } from "@/lib/config";

// Vista previa profesional al compartir el link: cuando un negocio pega su
// enlace en WhatsApp/Instagram, aparece SU nombre, descripción y logo — no un
// genérico. Se consulta Supabase server-side (solo columnas públicas).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fallback: Metadata = {
    title: "Reserva online — Buuki",
    description: "Reserva tu hora en línea.",
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;

  try {
    const res = await fetch(
      `${url}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}&select=name,description,logo_url&limit=1`,
      { headers: { apikey: key }, next: { revalidate: 300 } }
    );
    if (!res.ok) return fallback;
    const rows = (await res.json()) as {
      name?: string;
      description?: string;
      logo_url?: string;
    }[];
    const biz = rows[0];
    if (!biz?.name) return fallback;

    const title = `Reserva online — ${biz.name}`;
    const description =
      biz.description || `Reserva tu hora en ${biz.name}, en línea y al instante.`;
    const images = biz.logo_url ? [{ url: biz.logo_url }] : [{ url: "/icon-512.png" }];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/${slug}`,
        siteName: "Buuki",
        locale: "es_CL",
        type: "website",
        images,
      },
      twitter: { card: "summary", title, description },
    };
  } catch {
    return fallback;
  }
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ClientGate>
      <PublicSite slug={slug} />
    </ClientGate>
  );
}
