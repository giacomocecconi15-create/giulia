import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { faq } from "@/lib/faq";
import { faqSchema, offerCatalogSchema } from "@/lib/schema";
import { formatPrezzo, getListino } from "@/lib/servizi";
import { isPromoActive, promo, site } from "@/lib/site";

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

const lavori = [
  "Taglio donna corto con piega morbida",
  "Schiaritura airtouch su capelli lunghi",
  "Taglio uomo sfumato con modellatura barba",
  "Colore completo con tonalizzante",
  "Bodylights e piega mossa",
];

function FotoSegnaposto({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} (foto in arrivo)`}
      className={`flex items-end border border-line bg-tint p-4 ${className}`}
    >
      <span className="text-sm text-ink-3">{label}</span>
    </div>
  );
}

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

export default function Home() {
  const listino = getListino();
  const promoAttiva = isPromoActive();
  const nastro = listino.flatMap((s) => s.servizi.map((x) => x.nome));

  return (
    <main id="contenuto">
      <JsonLd data={offerCatalogSchema()} />
      <JsonLd data={faqSchema(faq)} />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 md:grid-cols-2 md:items-center md:px-8 md:pt-20">
        <div className="reveal">
          <p className="text-sm font-semibold tracking-widest text-ink-3 uppercase">Hair Salon &amp; Barber Shop, Pesaro</p>
          <h1 id="hero-title" className="mt-4 font-display text-5xl leading-[1.05] md:text-7xl">
            Porta i tuoi capelli al livello <span className="animate-oscillate">successivo</span>.
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-2">
            Taglio, colore, schiariture e barba in <strong className="text-ink">Strada Adriatica 109</strong>. Ti segue
            sempre <strong className="text-ink">Giulia</strong>, dall&apos;inizio alla fine.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <BottonePrenota />
            <Link href="#listino" className="inline-flex min-h-12 items-center px-1 font-semibold underline underline-offset-4 hover:text-blue">
              Vedi il listino
            </Link>
          </div>
        </div>
        <FotoSegnaposto label="Giulia al lavoro in salone" className="reveal aspect-[4/5] w-full" />
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

      {/* Lavori */}
      <section id="lavori" aria-labelledby="lavori-title" className="border-t border-line bg-tint">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <h2 id="lavori-title" className="font-display text-4xl md:text-5xl">
              I nostri lavori
            </h2>
            {site.instagram && (
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:text-blue">
                Altri lavori su Instagram
              </a>
            )}
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-6">
            {lavori.map((l, i) => (
              <li key={l} className={`reveal ${i < 2 ? "col-span-2 md:col-span-3" : "col-span-1 md:col-span-2"} ${i === 4 ? "col-span-2" : ""}`}>
                <figure>
                  <FotoSegnaposto label={l} className={i < 2 ? "aspect-[4/3]" : "aspect-square"} />
                  <figcaption className="sr-only">{l}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Promo prima visita */}
      {promoAttiva && (
        <section aria-labelledby="promo-title" className="animate-oscillate-border border-y-8 bg-ink text-bg">
          <div className="reveal mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[auto_1fr] md:items-center md:gap-16 md:px-8">
            <p className="animate-oscillate font-display text-8xl leading-none md:text-9xl" aria-hidden>
              -{promo.discountPercent}%
            </p>
            <div>
              <h2 id="promo-title" className="font-display text-4xl">
                -{promo.discountPercent}% sulla prima visita
              </h2>
              <p className="mt-3 max-w-lg text-lg">
                Su <strong>taglio donna</strong>, <strong>taglio uomo</strong> e <strong>piega</strong>, per prenotazioni
                online fatte entro il {promo.endLabel}. Lo sconto compare nel riepilogo prima di confermare.{" "}
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
        <p className="reveal mt-3 max-w-xl text-ink-2">Prezzi in euro, IVA inclusa. Puoi scegliere più servizi nella stessa prenotazione.</p>
        <div className="mt-10 grid gap-x-16 gap-y-12 md:grid-cols-2">
          {listino.map((sezione) => (
            <section key={sezione.id} aria-labelledby={`listino-${sezione.id}`} className="reveal">
              <h3 id={`listino-${sezione.id}`} className="border-b-2 border-ink pb-2 font-display text-2xl">
                {sezione.nome}
              </h3>
              <table className="w-full text-left">
                <caption className="sr-only">Prezzi {sezione.nome}</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Servizio</th>
                    <th scope="col">Prezzo</th>
                  </tr>
                </thead>
                <tbody>
                  {sezione.servizi.map((s) => (
                    <tr key={s.id} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 font-normal">
                        {s.nome}
                        {promoAttiva && s.promoEligible && (
                          <span className="ml-2 text-sm font-semibold text-magenta-text">prima visita -{promo.discountPercent}%</span>
                        )}
                      </th>
                      <td className="py-3 text-right font-semibold whitespace-nowrap tabular-nums">{formatPrezzo(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <div className="reveal mt-12">
          <BottonePrenota>Scegli i servizi e prenota</BottonePrenota>
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
