import Link from "next/link";
import { saveSettings } from "../actions";
import { btnPrimary, input, label } from "@/components/admin/ui";
import { loadSettings } from "@/lib/booking/server";
import { weekdays, type OpeningHours } from "@/lib/site";

export default async function Impostazioni() {
  const s = await loadSettings();
  const h = s.openingHours as OpeningHours;
  const num = (name: string, text: string, value: number, hint?: string) => (
    <div>
      <label htmlFor={name} className={label}>{text}</label>
      <input id={name} name={name} type="number" defaultValue={value} className={`${input} max-w-32`} />
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
  return (
    <>
      <h1 className="font-display text-3xl">Altro</h1>
      <nav className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/attesa" className="min-h-11 border border-line px-4 py-3 hover:border-ink">Lista d&apos;attesa</Link>
        <Link href="/admin/report" className="min-h-11 border border-line px-4 py-3 hover:border-ink">Report mensile</Link>
      </nav>

      <form action={saveSettings} className="mt-8 space-y-8">
        <fieldset>
          <legend className="font-display text-xl">Orari di apertura</legend>
          <p className="mt-1 text-sm text-ink-3">Due fasce al giorno: lo spazio in mezzo è la pausa. Lascia vuoto per chiuso.</p>
          <div className="mt-3 space-y-3">
            {weekdays.map((d) => {
              const slots = h[d.iso] ?? [];
              return (
                <div key={d.iso} className="grid grid-cols-[6rem_1fr] items-center gap-2 border-b border-line pb-3">
                  <span className="font-semibold">{d.label}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["a", "b"] as const).map((k, i) => (
                      <div key={k} className="flex items-center gap-1">
                        <input aria-label={`${d.label} fascia ${i + 1} apertura`} name={`h${d.iso}${k}o`} type="time" step={1800} defaultValue={slots[i]?.[0] ?? ""} className={`${input} px-1`} />
                        <span aria-hidden>-</span>
                        <input aria-label={`${d.label} fascia ${i + 1} chiusura`} name={`h${d.iso}${k}c`} type="time" step={1800} defaultValue={slots[i]?.[1] ?? ""} className={`${input} px-1`} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-3 font-display text-xl">Regole</legend>
          {num("freeCancellationHours", "Disdetta gratuita fino a (ore prima)", s.freeCancellationHours)}
          {num("minLeadMinutes", "Preavviso minimo online (minuti)", s.minLeadMinutes)}
          {num("bookingHorizonDays", "Prenotabile fino a (giorni avanti)", s.bookingHorizonDays)}
          {num("maxLateMinutes", "Ritardo massimo (minuti)", s.maxLateMinutes)}
          {num("recallDays", "Richiamo dopo (giorni senza visite)", s.recallDays)}
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-3 font-display text-xl">Promo prima visita</legend>
          {num("firstVisitDiscountPct", "Sconto (%)", s.discountPct, "0 per disattivare")}
          <div>
            <label htmlFor="promoEndDate" className={label}>Ultimo giorno per prenotare con lo sconto</label>
            <input id="promoEndDate" name="promoEndDate" type="date" defaultValue={s.promoEndDate.toISOString().slice(0, 10)} className={`${input} max-w-48`} />
          </div>
        </fieldset>

        <button className={`${btnPrimary} w-full sm:w-auto`}>Salva impostazioni</button>
      </form>
    </>
  );
}
