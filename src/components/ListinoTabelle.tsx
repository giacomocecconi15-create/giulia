import Link from "next/link";
import type { SezioneListino } from "@/lib/data";
import { formatPrezzo } from "@/lib/format";

/** Tabelle del listino per sezione. headingLevel: h2 nella pagina Listino, h3 in Home. */
export default function ListinoTabelle({
  listino,
  promoActive,
  discountPct,
  headingLevel = 3,
}: {
  listino: SezioneListino[];
  promoActive: boolean;
  discountPct: number;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
      {listino.map((sezione) => (
        <section key={sezione.id} id={sezione.id} aria-labelledby={`listino-${sezione.id}`} className="reveal">
          <H id={`listino-${sezione.id}`} className="border-b-2 border-ink pb-2 font-display text-2xl">
            {sezione.name}
          </H>
          <table className="w-full text-left">
            <caption className="sr-only">Prezzi {sezione.name}</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Servizio</th>
                <th scope="col">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              {sezione.services.map((s) => (
                <tr key={s.id} className="group border-b border-line transition-colors hover:bg-tint">
                  <th scope="row" className="p-0 font-normal">
                    <Link
                      href={`/prenota?servizi=${s.id}`}
                      className="flex min-h-12 flex-wrap items-center gap-x-2 py-3 pr-4 transition-colors group-hover:text-blue"
                    >
                      {s.name}
                      {promoActive && s.promoEligible && (
                        <span className="text-sm font-semibold text-magenta-text">prima visita -{discountPct}%</span>
                      )}
                      <span className="sr-only">: guarda il lavoro e prenota</span>
                    </Link>
                  </th>
                  <td className="p-0 text-right font-semibold whitespace-nowrap tabular-nums">
                    <Link href={`/prenota?servizi=${s.id}`} tabIndex={-1} aria-hidden className="flex min-h-12 items-center justify-end gap-2 py-3">
                      {formatPrezzo(s)}
                      <span className="text-ink-3 transition-transform group-hover:translate-x-0.5">›</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
