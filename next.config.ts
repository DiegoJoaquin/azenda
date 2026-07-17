import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isDev = process.env.NODE_ENV === "development";

// Content Security Policy: solo se permite conectar con la propia app y
// con Supabase; nada de scripts, iframes ni formularios de terceros.
// ('unsafe-inline' en script-src es requisito de los scripts de hidratación
// de Next; 'unsafe-eval' solo existe en desarrollo para el hot reload.)
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl}`,
  // Mapa embebido de Google en la página de reservas del negocio
  "frame-src https://maps.google.com https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Anti-clickjacking (refuerza frame-ancestors para navegadores antiguos)
  { key: "X-Frame-Options", value: "DENY" },
  // Impide que el navegador "adivine" tipos de contenido
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtrar URLs internas a sitios externos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La app no usa cámara, micrófono ni geolocalización
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Forzar HTTPS por 2 años
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
