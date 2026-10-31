import Link from "next/link";
import { blockSlot, unblock } from "./actions";
import { btn, statusText } from "@/components/admin/ui";
import { getDayAgenda, getWeekSummary } from "@/lib/admin";
import { formatEuro } from "@/lib/format";
import { addDays, isoWeekday, labelGiorno, labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function Agenda({ searchParams }: { searchParams: Promise<{ giorno?: string; vista?: string }> }) {
  const sp = await searchParams;
  const today = romeYmd(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.giorno ?? "") ? sp.giorno! : today;
  const week = sp.vista === "settimana";

  const nav = (
    <div className="flex items-center justify-between gap-2">
      <Link href={`/admin?giorno=${addDays(date, week ? -7 : -1)}${week ? "&vista=settimana" : ""}`} className={`${btn} px-3 text-sm`} aria-label="Precedente">
        Prima
      </Link>
      <div className="flex gap-0.5 text-sm">
        <Link href={`/admin?giorno=${date}`} aria-current={!week ? "page" : undefined} className={`min-h-11 px-2 py-3 ${!week ? "bg-ink text-bg" : "underline"}`}>
          Giorno
        </Link>
        <Link href={`/admin?giorno=${date}&vista=settimana`} aria-current={week ? "page" : undefined} className={`min-h-11 px-2 py-3 ${week ? "bg-ink text-bg" : "underline"}`}>
          Settimana
        </Link>
        {date !== today && (
          <Link href={`/admin${week ? "?vista=settimana" : ""}`} className="min-h-11 px-2 py-3 underline">
            Oggi
          </Link>
        )}
      </div>
      <Link href={`/admin?giorno=${addDays(date, week ? 7 : 1)}${week ? "&vista=settimana" : ""}`} className={`${btn} px-3 text-sm`} aria-label="Successivo">
        Dopo
      </Link>
    </div>
  );

  if (week) {
    const monday = addDays(date, 1 - isoWeekday(date));
    const days = await getWeekSummary(monday);
    return (
      <>
        <h1 className="font-display text-3xl">Settimana dal {labelGiorno(monday)}</h1>
        <div className="mt-4">{nav}</div>
        <ul className="mt-6 space-y-3">
          {days.map((d) => (
            <li key={d.date} className="border border-line">
              <Link href={`/admin?giorno=${d.date}`} className="flex items-center justify-between bg-tint px-4 py-3 font-semibold hover:text-blue">
                <span>{cap(labelGiornoLungo(d.date))}</span>
                <span className="text-sm text-ink-3">{d.bookings.length} {d.bookings.length === 1 ? "appuntamento" : "appuntamenti"}</span>
              </Link>
              {d.bookings.length > 0 && (
                <ul className="divide-y divide-line">
                  {d.bookings.map((b) => (
                    <li key={b.id}>
                      <Link href={`/admin/prenotazione/${b.id}`} className="flex gap-3 px-4 py-2 hover:bg-tint">
                        <span className="w-12 shrink-0 font-semibold tabular-nums">{romeHm(b.start)}</span>
                        <span className="min-w-0 truncate">
                          {b.customer.name} <span className="text-ink-3">{b.items.map((i) => i.service.name).join(", ")}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </>
    );
  }

  const { items, cancelled, fasce, slotMinutes } = await getDayAgenda(date);
  const count = items.filter((i) => i.kind === "booking").length;

  return (
    <>
      <h1 className="font-display text-3xl">{cap(labelGiornoLungo(date))}</h1>
      <p className="mt-1 text-ink-3">
        {fasce.length === 0 ? "Giorno di chiusura" : `${count} ${count === 1 ? "appuntamento" : "appuntamenti"}`}
      </p>
      <div className="mt-4">{nav}</div>

      <ol className="mt-6 border-t border-line">
        {items.map((it) =>
          it.kind === "booking" ? (
            <li key={it.id} className="border-b border-line">
              <Link href={`/admin/prenotazione/${it.id}`} className="flex gap-3 py-3 hover:bg-tint">
                <span className="w-14 shrink-0 font-semibold tabular-nums">{it.time}</span>
                <span className={`min-w-0 flex-1 border-l-4 pl-3 ${it.status === "confirmed" ? "border-blue" : it.status === "completed" ? "border-ink-3" : "border-magenta"}`}>
                  <span className="block font-semibold">
                    {it.name}
                    {it.confirmedByCustomer && <span className="ml-2 text-sm font-normal text-ink-3">ha confermato</span>}
                    {it.status !== "confirmed" && <span className="ml-2 text-sm font-normal text-magenta-text">{statusText[it.status]}</span>}
                  </span>
                  <span className="block text-sm text-ink-2">{it.services}</span>
                  <span className="block text-sm text-ink-3">
                    fino alle {it.endTime}, {formatEuro(it.priceCents)}
                    {it.createdByAdmin && ", telefono"}
                    {it.fromWaitlist && ", da lista d'attesa"}
                  </span>
                </span>
              </Link>
            </li>
          ) : it.kind === "block" ? (
            <li key={it.id} className="flex items-center gap-3 border-b border-line bg-tint py-2">
              <span className="w-14 shrink-0 pl-1 font-semibold tabular-nums">{it.time}</span>
              <span className="flex-1 text-ink-2">
                Bloccato fino alle {it.endTime} <span className="text-ink-3">({it.reason})</span>
              </span>
              <form action={unblock}>
                <input type="hidden" name="id" value={it.id} />
                <button className={`${btn} min-h-10 text-sm`}>Sblocca</button>
              </form>
            </li>
          ) : it.kind === "break" ? (
            <li key={`break-${it.time}`} className="border-b border-line py-2 text-center text-sm text-ink-3">
              Pausa {it.time}-{it.endTime}
            </li>
          ) : (
            <li key={it.start.toISOString()} className="flex items-center gap-3 border-b border-line py-1">
              <span className="w-14 shrink-0 text-ink-3 tabular-nums">{it.time}</span>
              <span className="flex-1 text-sm text-ink-3">Libero</span>
              <form action={blockSlot}>
                <input type="hidden" name="start" value={it.start.toISOString()} />
                <input type="hidden" name="minutes" value={slotMinutes} />
                <button className="min-h-11 px-3 text-sm font-semibold underline underline-offset-4">Blocca</button>
              </form>
              <Link href={`/admin/nuova?giorno=${date}&ora=${it.time}`} className="min-h-11 px-2 py-3 text-sm font-semibold underline underline-offset-4">
                Prenota
              </Link>
            </li>
          ),
        )}
      </ol>

      {cancelled.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Disdette</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {cancelled.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/prenotazione/${b.id}`} className="flex gap-3 py-2 hover:bg-tint">
                  <span className="w-14 shrink-0 tabular-nums">{romeHm(b.start)}</span>
                  <span>
                    {b.customer.name}
                    {b.lateCancellation && <span className="ml-2 text-sm text-magenta-text">tardiva{b.chargedAt ? ", addebitata" : ""}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
