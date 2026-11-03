import Link from "next/link";
import { BarList, Columns, Tile } from "@/components/admin/Charts";
import { getStats } from "@/lib/stats";

const periodi = [
  { days: 30, label: "30 giorni" },
  { days: 90, label: "3 mesi" },
  { days: 365, label: "12 mesi" },
];

export default async function Statistiche({ searchParams }: { searchParams: Promise<{ giorni?: string }> }) {
  const sp = await searchParams;
  const days = periodi.some((p) => String(p.days) === sp.giorni) ? Number(sp.giorni) : 30;
  const s = await getStats(days);
  const k = s.kpi;

  return (
    <>
      <h1 className="font-display text-3xl">Statistiche</h1>
      <nav aria-label="Periodo" className="mt-4 flex flex-wrap gap-2">
        {periodi.map((p) => (
          <Link
            key={p.days}
            href={`/admin/statistiche?giorni=${p.days}`}
            aria-current={p.days === days ? "page" : undefined}
            className={`inline-flex min-h-11 items-center border px-4 text-sm font-semibold ${p.days === days ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"}`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="sintesi" className="mt-6">
        <h2 id="sintesi" className="sr-only">Sintesi</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Prenotazioni ricevute" value={k.prenotazioni} note={k.percOnline === null ? undefined : `${k.percOnline}% online`} />
          <Tile label="Nuovi profili" value={k.nuoviProfili} note={`${k.clienti} clienti in tutto`} />
          <Tile label="Click verso Instagram" value={k.clickInstagram} note={`${k.clickPost} su post, ${k.clickProfilo} sul profilo`} />
          <Tile label="Disdette tardive e no-show" value={k.tardiveNoShow} note={`${k.recuperati} posti recuperati dalla lista d'attesa`} />
        </div>
      </section>

      <section aria-labelledby="servizi" className="mt-8">
        <h2 id="servizi" className="font-display text-xl">Prenotazioni</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <BarList title="Per servizio" data={s.perServizio} unit="Prenotazioni" empty="Nessuna prenotazione nel periodo." />
          <BarList title="Da dove arrivano" data={s.fonti} unit="Prenotazioni" empty="Nessuna prenotazione nel periodo." percent />
        </div>
      </section>

      <section aria-labelledby="clienti" className="mt-8">
        <h2 id="clienti" className="font-display text-xl">Clienti</h2>
        <p className="mt-1 text-sm text-ink-3">
          Profilo compilato da {k.conProfilo} clienti su {k.clienti}. Dati facoltativi, mostrati solo in forma aggregata.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Columns title="Nuovi profili per mese" data={s.profiliMese} unit="Profili" />
          <BarList title="Tipo di capelli" data={s.capelli} unit="Clienti" empty="Nessun cliente." percent />
          <BarList title="Fascia d'età" data={s.eta} unit="Clienti" empty="Nessun cliente." percent />
          <Columns title="Click verso Instagram per mese" data={s.clickMese} unit="Click" />
        </div>
      </section>

      <p className="mt-8 text-sm text-ink-3">
        Periodo: ultimi {s.days} giorni (i grafici mensili mostrano sempre gli ultimi 6 mesi). Per il file Excel usa il{" "}
        <Link href="/admin/report" className="underline">report mensile</Link>.
      </p>
    </>
  );
}
