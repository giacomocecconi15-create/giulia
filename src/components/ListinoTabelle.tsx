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
                <tr key={s.id} className="border-b border-line">
                  <th scope="row" className="py-3 pr-4 font-normal">
                    {s.name}
                    {promoActive && s.promoEligible && (
                      <span className="ml-2 text-sm font-semibold text-magenta-text">prima visita -{discountPct}%</span>
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
  );
}
