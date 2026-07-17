// Configuración comercial de la plataforma.

// Días de prueba gratis al registrarse (el valor real lo fija la base de
// datos en trial_ends_at; este se usa para textos de la interfaz).
export const TRIAL_DAYS = 7;

// Contacto del dueño de la plataforma (Diego) para activaciones y soporte.
export const CONTACT_EMAIL = "buukiapp@gmail.com";
export const CONTACT_WHATSAPP = "56933278938"; // formato internacional sin "+"

export function whatsappLink(message: string): string {
  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function emailLink(subject: string, body: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Slug del negocio de demostración (usa datos locales, no Supabase)
export const DEMO_SLUG = "aura-estudio";

// Dominio público de la plataforma (actualizar al comprar dominio propio).
export const SITE_URL = "https://buuki.cl";

/** URL pública de reservas de un negocio, la que comparte con sus clientes. */
export function bookingUrl(slug: string): string {
  return `${SITE_URL}/${slug}`;
}
