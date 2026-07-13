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

const SITE_URL = "https://azenda-nu.vercel.app";
const DESC =
  "Reservas online, agenda por profesional y gestión de clientes en una sola plataforma, adaptada a tu rubro.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Azenda — Agenda online y gestión para negocios de servicios",
  description: DESC,
  openGraph: {
    title: "Azenda — Tu agenda ordenada, tus horas reservadas solas",
    description: DESC,
    url: SITE_URL,
    siteName: "Azenda",
    locale: "es_CL",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Azenda" }],
  },
  twitter: {
    card: "summary",
    title: "Azenda — Agenda online para negocios de servicios",
    description: DESC,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Azenda",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf9f6",
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
