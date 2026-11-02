import type { Metadata } from "next";
import Link from "next/link";
import CatalogoServizi from "@/components/CatalogoServizi";
import JsonLd from "@/components/JsonLd";
import { catalogo, categorieDaSezione } from "@/data/catalogo";
import { formatPrezzo } from "@/lib/format";
import ListinoTabelle from "@/components/ListinoTabelle";
import { getInfoSalone, getListino } from "@/lib/data";
import { offerCatalogSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Listino prezzi",
  description:
    "Prezzi di Level Up a Pesaro: taglio donna e uomo, piega, colore, schiariture (airtouch, balayage, mèches), cheratina, trattamenti e barba.",
  alternates: { canonical: "/listino" },
};

export default async function Listino() {
  const [listino, info] = await Promise.all([getListino(), getInfoSalone()]);
  const voci = listino.flatMap((sezione) =>
    sezione.services.map((s) => ({
      id: s.id,
      name: s.name,
      priceLabel: formatPrezzo(s),
      promoEligible: s.promoEligible,
      categorie: catalogo[s.id]?.categorie ?? categorieDaSezione(sezione.id),
      descrizione: catalogo[s.id]?.descrizione ?? sezione.name,
      video: catalogo[s.id]?.video,
      immagine: catalogo[s.id]?.immagine,
      videoIA: catalogo[s.id]?.videoIA,
    })),
  );
  return (
    <main id="contenuto" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
      <JsonLd data={offerCatalogSchema(listino)} />
      <h1 className="reveal font-display text-5xl md:text-6xl">Listino prezzi</h1>
      <ul className="reveal mt-4 max-w-xl list-disc space-y-1 pl-5 text-ink-2">
        <li>Prezzi in euro, IVA inclusa.</li>
        <li>Puoi scegliere più servizi nella stessa prenotazione.</li>
        {info.promoActive && (
          <li>
            <strong className="text-ink">-{info.discountPct}% sulla prima visita</strong> su taglio donna, taglio uomo e
            piega, entro il {info.promoEndLabel}.{" "}
            <Link href="/termini#promozione" className="underline underline-offset-2 hover:text-blue">
              Condizioni
            </Link>
          </li>
        )}
      </ul>
      <CatalogoServizi voci={voci} promoActive={info.promoActive} discountPct={info.discountPct} />

      <h2 id="prezzi" className="reveal mt-20 font-display text-4xl">
        Tutti i prezzi
      </h2>
      <nav aria-label="Sezioni del listino" className="reveal mt-6">
        <ul className="flex flex-wrap gap-2">
          {listino.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex min-h-11 items-center border border-line px-4 transition-colors hover:border-ink">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-12">
        <ListinoTabelle listino={listino} promoActive={info.promoActive} discountPct={info.discountPct} headingLevel={3} />
      </div>
      <Link
        href="/prenota"
        className="reveal mt-12 inline-flex min-h-12 items-center border border-ink bg-ink px-6 text-lg font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink"
      >
        Scegli i servizi e prenota
      </Link>
    </main>
  );
}
