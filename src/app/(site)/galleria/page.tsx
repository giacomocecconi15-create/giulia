import type { Metadata } from "next";
import Link from "next/link";
import GalleriaGrid from "@/components/galleria/GalleriaGrid";
import InstagramLink from "@/components/galleria/InstagramLink";
import { getGalleria } from "@/lib/instagram";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Galleria",
  description:
    "I lavori di Giulia da Level Up a Pesaro: tagli, colore, balayage e schiariture, acconciature sposa, cheratina e barber. Lasciati ispirare e prenota.",
  alternates: { canonical: "/galleria" },
};

export const revalidate = 3600;

export default async function Galleria() {
  const { posts } = await getGalleria();
  const profilo = site.instagram || "https://www.instagram.com/level_up_pesaro/";
  return (
    <main id="contenuto" className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-5xl md:text-6xl">Galleria</h1>
      <p className="mt-3 max-w-xl text-ink-2">
        I lavori di Giulia, divisi per servizio. Tocca una foto per aprirla su Instagram.
      </p>
      <div className="mt-8">
        <GalleriaGrid posts={posts} />
      </div>
      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Link
          href="/prenota"
          className="inline-flex min-h-12 items-center border border-ink bg-ink px-6 text-lg font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink"
        >
          Prenota il tuo nuovo stile
        </Link>
        <InstagramLink href={profilo} className="inline-flex min-h-12 items-center px-1 font-semibold underline underline-offset-4 hover:text-blue">
          Segui Level Up su Instagram
        </InstagramLink>
      </div>
    </main>
  );
}
