import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://buuki.cl";
const DESC =
  "Reservas online, agenda por profesional y gestión de clientes en una sola plataforma, adaptada a tu rubro.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Buuki — Agenda online y gestión para negocios de servicios",
  description: DESC,
  openGraph: {
    title: "Buuki — Tu agenda ordenada, tus horas reservadas solas",
    description: DESC,
    url: SITE_URL,
    siteName: "Buuki",
    locale: "es_CL",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Buuki" }],
  },
  twitter: {
    card: "summary",
    title: "Buuki — Agenda online para negocios de servicios",
    description: DESC,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Buuki",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5ef",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
