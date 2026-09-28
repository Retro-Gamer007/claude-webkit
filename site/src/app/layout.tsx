import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { BUSINESS } from "@/lib/config";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const description =
  "Transporte privado desde Asbury Park, NJ. Aeropuertos, puerta a puerta y viajes a cualquier estado. Servicio 24/7, pide tu viaje con tu ubicación o por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.url),
  title: {
    default: `${BUSINESS.name} | Te llevamos a donde vayas`,
    template: `%s | ${BUSINESS.name}`,
  },
  description,
  openGraph: {
    title: `${BUSINESS.name} | Te llevamos a donde vayas`,
    description,
    locale: "es_US",
    type: "website",
    images: [{ url: "/images/chofer-rav4.webp", width: 1010, height: 520 }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b1b33",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
