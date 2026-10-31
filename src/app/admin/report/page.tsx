import Link from "next/link";
import { btn, btnPrimary, input, label } from "@/components/admin/ui";
import { formatEuro } from "@/lib/format";
import { monthlyRow, newCustomerRows } from "@/lib/report";
import { loadReportBookings } from "@/lib/report-data";
import { romeYmd } from "@/lib/time";

const monthLabel = (m: string) =>
  new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

export default async function Report({ searchParams }: { searchParams: Promise<{ mese?: string }> }) {
  const sp = await searchParams;
  const current = romeYmd(new Date()).slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(sp.mese ?? "") ? sp.mese! : current;
  const all = await loadReportBookings();
  const m = monthlyRow(all, month);
  const clienti = newCustomerRows(all, month);

  const kpi: [string, string][] = [
    ["Prenotazioni online", String(m.prenotazioniOnline)],
    ["Prenotazioni al telefono", String(m.prenotazioniTelefono)],
    ["% online", m.percentualeOnline === null ? "-" : `${Math.round(m.percentualeOnline * 100)}%`],
    ["Nuovi clienti", String(m.nuoviClienti)],
    ["di cui da canali online", String(m.nuoviClientiOnline)],
    ["Ricavo primo servizio (online)", formatEuro(Math.round(m.ricavoPrimoServizioOnlineEuro * 100))],
    ["Disdette tardive e no-show", String(m.disdetteTardiveNoShow)],
    ["Slot recuperati dalla lista d'attesa", String(m.slotRecuperati)],
    ["Disdette totali", String(m.disdetteTotali)],
  ];

  return (
    <>
      <Link href="/admin/impostazioni" className="text-sm underline underline-offset-4">Altro</Link>
      <h1 className="mt-4 font-display text-3xl first-letter:uppercase">Report di {monthLabel(month)}</h1>
      <form className="mt-4 flex items-end gap-2">
        <div>
          <label htmlFor="mese" className={label}>Mese</label>
          <input id="mese" name="mese" type="month" defaultValue={month} className={input} />
        </div>
        <button className={btn}>Mostra</button>
      </form>

      <table className="mt-6 w-full text-left">
        <caption className="sr-only">Indicatori del mese</caption>
        <tbody>
          {kpi.map(([k, v]) => (
            <tr key={k} className="border-b border-line">
              <th scope="row" className="py-2 font-normal">{k}</th>
              <td className="py-2 text-right font-semibold tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`/api/admin/report?mese=${month}&tipo=mensile`} className={btnPrimary} download>
          Scarica CSV foglio Mensile
        </a>
        <a href={`/api/admin/report?mese=${month}&tipo=clienti`} className={btn} download>
          Scarica CSV foglio Clienti
        </a>
      </div>
      <p className="mt-2 text-sm text-ink-3">
        Le colonne corrispondono ai fogli del file di monitoraggio: incolla le righe a partire dalla prima riga libera.
      </p>

      <h2 className="mt-10 font-display text-xl">Nuovi clienti del mese</h2>
      {clienti.length === 0 ? (
        <p className="mt-2 text-ink-3">Nessuno.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {clienti.map((c, i) => (
            <li key={i} className="py-2 text-sm">
              <strong>{c.nome}</strong> {c.dataPrimaVisita.split("-").reverse().join("/")}, {c.fonte}
              {c.campagna && ` (${c.campagna})`}, {c.servizio}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
