import type { MetadataRoute } from "next";

// Bloquea la indexación de zonas privadas/operativas; el resto es público.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/demo", "/onboarding", "/api", "/nueva-clave"],
    },
  };
}
