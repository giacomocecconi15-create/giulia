import type { Metadata, Viewport } from "next";
import { Gloock, Karla } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import JsonLd from "@/components/JsonLd";
import RevealObserver from "@/components/Reveal";
import UtmCapture from "@/components/UtmCapture";
import { getInfoSalone } from "@/lib/data";
import { businessSchema } from "@/lib/schema";
import { site } from "@/lib/site";
import "./globals.css";

const gloock = Gloock({ variable: "--font-gloock", weight: "400", subsets: ["latin"], display: "swap" });
const karla = Karla({ variable: "--font-karla", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Level Up Pesaro | Parrucchiere e Barber Shop, prenota online",
    template: "%s | Level Up Pesaro",
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: site.name,
    title: "Level Up Pesaro | Parrucchiere e Barber Shop",
    description: site.description,
  },
  alternates: { canonical: "/" },
  ...(!site.indexing && { robots: { index: false, follow: false } }),
};

// Ricalcola ogni ora: la promo scade da sola senza nuovo deploy.
export const revalidate = 3600;

export const viewport: Viewport = { themeColor: "#FCFFFF" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const info = await getInfoSalone();
  return (
    <html lang="it" className={`${gloock.variable} ${karla.variable}`}>
      <head>
        <JsonLd data={businessSchema(info)} />
      </head>
      <body className="antialiased">
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-bg"
        >
          Vai al contenuto
        </a>
        {children}
        <CookieConsent />
        <RevealObserver />
        <UtmCapture />
      </body>
    </html>
  );
}
