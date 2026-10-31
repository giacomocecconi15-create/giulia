import { blockDays, unblock } from "../actions";
import { btn, btnPrimary, input, label } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { labelGiorno, romeHm, romeYmd } from "@/lib/time";

export default async function Blocchi() {
  const blocks = await prisma.block.findMany({ where: { end: { gt: new Date() } }, orderBy: { start: "asc" }, take: 100 });
  const today = romeYmd(new Date());
  return (
    <>
      <h1 className="font-display text-3xl">Ferie e chiusure</h1>
      <form action={blockDays} className="mt-6 grid grid-cols-2 gap-3 border border-line p-4">
        <div>
          <label htmlFor="from" className={label}>Dal giorno</label>
          <input id="from" name="from" type="date" required min={today} className={input} />
        </div>
        <div>
          <label htmlFor="to" className={label}>Al giorno (incluso)</label>
          <input id="to" name="to" type="date" min={today} className={input} />
        </div>
        <div>
          <label htmlFor="fromTime" className={label}>Dalle (facoltativo)</label>
          <input id="fromTime" name="fromTime" type="time" step={1800} className={input} />
        </div>
        <div>
          <label htmlFor="toTime" className={label}>Alle (facoltativo)</label>
          <input id="toTime" name="toTime" type="time" step={1800} className={input} />
        </div>
        <div className="col-span-2">
          <label htmlFor="reason" className={label}>Motivo</label>
          <input id="reason" name="reason" defaultValue="ferie" className={input} />
        </div>
        <button className={`${btnPrimary} col-span-2`}>Blocca</button>
        <p className="col-span-2 text-xs text-ink-3">Le prenotazioni già presenti in quei giorni restano: disdicile dall&apos;agenda se serve.</p>
      </form>

      <h2 className="mt-10 font-display text-xl">Blocchi in programma</h2>
      {blocks.length === 0 ? (
        <p className="mt-2 text-ink-3">Nessuno.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <strong>{labelGiorno(romeYmd(b.start))} {romeHm(b.start)}</strong> - {labelGiorno(romeYmd(new Date(b.end.getTime() - 1)))} {romeHm(b.end)}
                <span className="ml-2 text-sm text-ink-3">{b.reason}</span>
              </span>
              <form action={unblock}>
                <input type="hidden" name="id" value={b.id} />
                <button className={`${btn} min-h-10 text-sm`}>Elimina</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
