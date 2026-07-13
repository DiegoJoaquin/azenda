import type { MetadataRoute } from "next";

const BASE = "https://azenda-nu.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/terminos`, lastModified: now, priority: 0.3 },
    { url: `${BASE}/privacidad`, lastModified: now, priority: 0.3 },
  ];
}
