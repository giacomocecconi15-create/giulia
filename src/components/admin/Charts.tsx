import type { Bar } from "@/lib/stats";

/**
 * Grafici a una sola serie, senza librerie. Colore unico (blu del sito, contrasto
 * 3,4:1 sullo sfondo), testi in inchiostro, angoli netti come il resto del sito.
 * Ogni grafico ha la tabella dei dati.
 */

function DataTable({ data, unit, caption }: { data: Bar[]; unit: string; caption: string }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink-2 underline underline-offset-4">Mostra la tabella</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink">
            <th scope="col" className="py-1 font-semibold">Voce</th>
            <th scope="col" className="py-1 text-right font-semibold">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label} className="border-b border-line">
              <th scope="row" className="py-1 font-normal">{d.label}</th>
              <td className="py-1 text-right tabular-nums">
                {d.value}
                {d.detail && <span className="ml-2 text-ink-3">{d.detail}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Barre orizzontali ordinate (conteggi per voce). Valore alla punta della barra. */
export function BarList({ title, data, unit, empty, percent }: { title: string; data: Bar[]; unit: string; empty: string; percent?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <figure className="border border-line p-4">
      <figcaption className="font-semibold">{title}</figcaption>
      {total === 0 ? (
        <p className="mt-3 text-sm text-ink-3">{empty}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {data.map((d) => {
              const pct = total ? Math.round((d.value / total) * 100) : 0;
              const text = `${d.value}${percent ? ` (${pct}%)` : ""}`;
              return (
                <li key={d.label} className="group grid grid-cols-[minmax(6rem,9rem)_1fr] items-center gap-3 text-sm" title={`${d.label}: ${text}${d.detail ? `, ${d.detail}` : ""}`}>
                  <span className="truncate text-ink-2">{d.label}</span>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-4 max-h-6 bg-blue transition-opacity group-hover:opacity-80"
                      style={{ width: `${(d.value / max) * 68}%`, minWidth: d.value ? 2 : 0 }}
                    />
                    <span className="font-semibold whitespace-nowrap tabular-nums">{text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <DataTable data={data} unit={unit} caption={title} />
        </>
      )}
    </figure>
  );
}

/** Colonne nel tempo (mesi). Valore sul cappello solo per l'ultimo mese e il massimo. */
export function Columns({ title, data, unit }: { title: string; data: Bar[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const maxIdx = data.findIndex((d) => d.value === max);
  const H = 120;
  return (
    <figure className="border border-line p-4">
      <figcaption className="font-semibold">{title}</figcaption>
      <div className="mt-4 flex items-end gap-0.5 border-b border-line" style={{ height: H + 22 }} role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * H);
          const label = i === data.length - 1 || (i === maxIdx && d.value > 0);
          return (
            <div key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.value}`}>
              <span className={`mb-1 text-xs font-semibold tabular-nums ${label ? "" : "opacity-0 group-hover:opacity-100"}`}>{d.value}</span>
              <span aria-hidden className="w-full max-w-6 bg-blue transition-opacity group-hover:opacity-80" style={{ height: Math.max(h, d.value ? 2 : 0) }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-0.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-ink-3">{d.label}</span>
        ))}
      </div>
      <DataTable data={data} unit={unit} caption={title} />
    </figure>
  );
}

/** Numero in evidenza. */
export function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border border-line p-4">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-display text-4xl leading-none tabular-nums">{value}</p>
      {note && <p className="mt-2 text-xs text-ink-3">{note}</p>}
    </div>
  );
}
