import Image from "next/image";
import Link from "next/link";
import GalleriaGrid from "@/components/galleria/GalleriaGrid";
import InstagramLink from "@/components/galleria/InstagramLink";
import JsonLd from "@/components/JsonLd";
import ListinoTabelle from "@/components/ListinoTabelle";
import { getInfoSalone, getListino } from "@/lib/data";
import { anteprima, getGalleria } from "@/lib/instagram";
import { buildFaq } from "@/lib/faq";
import { faqSchema, offerCatalogSchema } from "@/lib/schema";
import { site } from "@/lib/site";

const valori = [
  {
    titolo: "Una persona sola",
    testo: "Ti segue sempre Giulia, dalla consulenza al risultato. Nessun passaggio di mano, nessuna fretta.",
  },
  {
    titolo: "Tecnica e ascolto",
    testo: "Prima capiamo cosa vuoi e cosa ti sta bene. Poi scegliamo insieme taglio, colore o trattamento.",
  },
  {
    titolo: "Tempo rispettato",
    testo: "Prenoti online in un minuto e l'orario è tuo. Ricevi conferma e promemoria su WhatsApp.",
  },
];

function BottonePrenota({ children = "Prenota ora" }: { children?: React.ReactNode }) {
  return (
    <Link
      href="/prenota"
      className="inline-flex min-h-12 items-center border border-ink bg-ink px-6 text-lg font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink"
    >
      {children}
    </Link>
  );
}

export default async function Home() {
  const [listino, info, galleria] = await Promise.all([getListino(), getInfoSalone(), getGalleria()]);
  const preview = anteprima(galleria.posts, 8);
  const mappe = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Level Up ${site.address.street} ${site.address.city}`)}`;
  const promoAttiva = info.promoActive;
  const nastro = listino.flatMap((s) => s.services.map((x) => x.name));
  const prezzi = Object.fromEntries(listino.flatMap((s) => s.services.map((x) => [x.id, x.priceCents])));
  const faq = buildFaq(info, prezzi);

  return (
    <main id="contenuto">
      <JsonLd data={offerCatalogSchema(listino)} />
      <JsonLd data={faqSchema(faq)} />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 md:grid-cols-2 md:items-center md:px-8 md:pt-20">
        <div className="reveal">
          <h1 id="hero-title" className="font-display text-5xl leading-[1.05] md:text-7xl">
            Porta i tuoi capelli al livello <span className="animate-oscillate">successivo</span>.
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BottonePrenota />
            <Link
              href="/galleria"
              className="inline-flex min-h-12 items-center border border-ink px-6 text-lg font-semibold transition-colors hover:bg-ink hover:text-bg"
            >
              Lasciati ispirare
            </Link>
          </div>
        </div>
        <figure className="reveal">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-tint">
            <Image
              src="/images/giulia.jpg"
              alt="Giulia, titolare di Level Up, sorride nel suo salone di Pesaro con un mazzo di fiori in mano"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-top"
            />
          </div>
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <address className="not-italic">
              <span className="font-semibold">Level Up, {site.address.street}</span>, {site.address.city}
            </address>
            <a href={mappe} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 hover:text-blue">
              Indicazioni stradali
            </a>
          </figcaption>
        </figure>
      </section>

      {/* Nastro servizi */}
      <section aria-label="I nostri servizi" className="overflow-hidden border-y border-line bg-ink py-4 text-bg">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap motion-reduce:animate-none">
          {[0, 1].map((copia) => (
            <ul key={copia} aria-hidden={copia === 1} className="flex gap-10 font-display text-2xl">
              {nastro.map((n) => (
                <li key={n} className="flex items-center gap-10">
                  {n}
                  <span aria-hidden className="inline-block h-2 w-2 animate-oscillate-bg" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* Valori */}
      <section id="valori" aria-labelledby="valori-title" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <h2 id="valori-title" className="reveal font-display text-4xl md:text-5xl">
          Come lavoriamo
        </h2>
        <ul className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
          {valori.map((v, i) => (
            <li key={v.titolo} className="reveal bg-bg p-6 md:p-8">
              <span className="font-display text-3xl text-blue">0{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{v.titolo}</h3>
              <p className="mt-2 text-ink-2">{v.testo}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Galleria: anteprima (4-8 foto), tutto il resto in /galleria */}
      <section id="galleria" aria-labelledby="galleria-title" className="border-t border-line bg-tint">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <h2 id="galleria-title" className="font-display text-4xl md:text-5xl">
              Galleria
            </h2>
            <Link href="/galleria" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:text-blue">
              Vedi tutta la galleria
            </Link>
          </div>
          <div className="reveal mt-10">
            <GalleriaGrid posts={preview} filtri={false} />
          </div>
          {site.instagram && (
            <InstagramLink href={site.instagram} className="mt-6 inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:text-blue">
              Seguici su Instagram
            </InstagramLink>
          )}
        </div>
      </section>

      {/* Promo prima visita */}
      {promoAttiva && (
        <section aria-labelledby="promo-title" className="animate-oscillate-border border-y-8 bg-ink text-bg">
          <div className="reveal mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[auto_1fr] md:items-center md:gap-16 md:px-8">
            <p className="animate-oscillate font-display text-8xl leading-none md:text-9xl" aria-hidden>
              -{info.discountPct}%
            </p>
            <div>
              <h2 id="promo-title" className="font-display text-4xl">
                -{info.discountPct}% sulla prima visita
              </h2>
              <p className="mt-3 max-w-lg text-lg">
                Su <strong>taglio donna</strong>, <strong>taglio uomo</strong> e <strong>piega</strong>, per prenotazioni
                online fatte entro il {info.promoEndLabel}. Lo sconto compare nel riepilogo prima di confermare.{" "}
                <Link href="/termini#promozione" className="underline underline-offset-2 hover:text-blue">
                  Condizioni
                </Link>
              </p>
              <Link
                href="/prenota"
                className="mt-6 inline-flex min-h-12 items-center border border-bg bg-bg px-6 text-lg font-semibold text-ink transition-colors hover:border-blue hover:bg-blue"
              >
                Prenota la prima visita
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Listino */}
      <section id="listino" aria-labelledby="listino-title" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <h2 id="listino-title" className="reveal font-display text-4xl md:text-5xl">
          Listino
        </h2>
        <p className="reveal mt-3 max-w-xl text-ink-2">Prezzi in euro, IVA inclusa. Tocca un servizio per vedere il lavoro e scegliere subito giorno e ora.</p>
        <div className="mt-10">
          <ListinoTabelle listino={listino} promoActive={promoAttiva} discountPct={info.discountPct} />
        </div>
        <div className="reveal mt-12 flex flex-wrap items-center gap-4">
          <BottonePrenota>Scegli i servizi e prenota</BottonePrenota>
          <Link href="/galleria" className="inline-flex min-h-12 items-center px-1 font-semibold underline underline-offset-4 hover:text-blue">
            Guarda i lavori
          </Link>
        </div>
      </section>

      {/* Citazione: da sostituire con parole di Giulia (HANDOFF §9) */}
      <section aria-label="Le parole di Giulia" className="border-y border-line bg-tint">
        <figure className="reveal mx-auto max-w-4xl px-4 py-20 text-center md:px-8">
          <blockquote className="font-display text-3xl leading-snug md:text-5xl">
            &ldquo;Ogni persona che si siede sulla mia poltrona deve uscire sentendosi un livello sopra.&rdquo;
          </blockquote>
          <figcaption className="mt-6 text-ink-2">
            <span className="mx-auto mb-4 block h-1 w-16 animate-oscillate-bg" aria-hidden />
            Giulia, fondatrice di Level Up
          </figcaption>
        </figure>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-20 md:px-8">
        <h2 id="faq-title" className="reveal font-display text-4xl md:text-5xl">
          Domande frequenti
        </h2>
        <div className="mt-8 border-t border-line">
          {faq.map((f) => (
            <details key={f.q} className="reveal group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold transition-colors hover:text-blue [&::-webkit-details-marker]:hidden">
                <h3>{f.q}</h3>
                <span aria-hidden className="text-2xl leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
