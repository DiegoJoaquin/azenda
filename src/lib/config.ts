// Configuración comercial de la plataforma.

// Días de prueba gratis al registrarse (el valor real lo fija la base de
// datos en trial_ends_at; este se usa para textos de la interfaz).
export const TRIAL_DAYS = 7;

// Número de WhatsApp del dueño de la plataforma (Diego) para activaciones
// y soporte. Formato internacional sin "+" ni espacios.
// TODO: reemplazar por el número real antes del lanzamiento.
export const CONTACT_WHATSAPP = "56912345678";

export function whatsappLink(message: string): string {
  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// Slug del negocio de demostración (usa datos locales, no Supabase)
export const DEMO_SLUG = "aura-estudio";
