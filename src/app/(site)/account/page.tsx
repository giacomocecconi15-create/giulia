import type { Metadata } from "next";
import Link from "next/link";
import { AccountLogin, CancelButton, ConsentToggle, LogoutButton } from "@/components/account/AccountActions";
import { getAccountData } from "@/lib/account";
import { CUTS_FOR_REWARD, REWARD_LABEL } from "@/lib/carnet";
import { formatEuro } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { getCurrentCustomer } from "@/lib/session";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

export const metadata: Metadata = { title: "Il tuo account", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusLabel = {
  confirmed: "Confermata",
  completed: "Fatta",
  cancelled: "Disdetta",
  no_show: "Non presentato",
} as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function Account() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <main id="contenuto" className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <h1 className="font-display text-5xl">Accedi</h1>
        <p className="mt-3 max-w-lg text-ink-2">
          Inserisci il cellulare: ti mandiamo un codice su WhatsApp. Niente email e niente password.
        </p>
        <div className="mt-8 max-w-sm">
          <AccountLogin />
        </div>
      </main>
    );
  }

  const now = new Date();
  const { upcoming, past, card, settings, waitlist } = await getAccountData(customer.id, now);
  const freeMs = settings.freeCancellationHours * 3_600_000;

  return (
    <main id="contenuto" className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Ciao {customer.name}</h1>
          <p className="mt-2 text-ink-3">{formatPhone(customer.phone)}</p>
        </div>
        <div className="flex items-center gap-6">
          {customer.role === "admin" && (
            <Link href="/admin" className="min-h-11 font-semibold underline underline-offset-4 hover:text-blue">
              Agenda
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* Prossimi appuntamenti */}
      <section aria-labelledby="prossimi" className="mt-12">
        <h2 id="prossimi" className="border-b-2 border-ink pb-2 font-display text-3xl">
          {upcoming.length > 1 ? "Prossimi appuntamenti" : "Prossimo appuntamento"}
        </h2>
        {upcoming.length === 0 ? (
          <div className="py-6">
            <p className="text-ink-2">Nessun appuntamento in programma.</p>
            <Link
              href="/prenota"
              className="mt-4 inline-flex min-h-12 items-center border border-ink bg-ink px-6 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink"
            >
              Prenota
            </Link>
          </div>
        ) : (
          <ul>
            {upcoming.map((b) => {
              const late = b.start.getTime() - now.getTime() < freeMs;
              return (
                <li key={b.id} className="border-b border-line py-6">
                  <p className="font-display text-2xl">
                    {cap(labelGiornoLungo(romeYmd(b.start)))}, ore {romeHm(b.start)}
                  </p>
                  <p className="mt-1 text-ink-2">{b.items.map((i) => i.service.name).join(", ")}</p>
                  <p className="mt-1 text-ink-2">
                    Totale {formatEuro(b.totalPriceCents - b.discountCents)}
                    {b.discountCents > 0 && ", con sconto prima visita"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {late ? (
                      <p className="text-sm text-ink-3">Mancano meno di 24 ore: per spostarlo scrivici su WhatsApp.</p>
                    ) : (
                      <Link
                        href={`/prenota?sposta=${b.id}`}
                        className="inline-flex min-h-11 items-center border border-ink px-4 font-semibold transition-colors hover:bg-ink hover:text-bg"
                      >
                        Sposta
                      </Link>
                    )}
                    <CancelButton bookingId={b.id} late={late} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {waitlist.length > 0 && (
          <p className="mt-4 text-sm text-ink-2">
            Sei in lista d&apos;attesa per:{" "}
            {waitlist.map((w) => labelGiornoLungo(w.date.toISOString().slice(0, 10))).join(", ")}. Ti avvisiamo su WhatsApp
            se si libera un posto.
          </p>
        )}
      </section>

      {/* Carnet */}
      <section aria-labelledby="carnet" className="mt-12">
        <h2 id="carnet" className="border-b-2 border-ink pb-2 font-display text-3xl">
          Carnet
        </h2>
        <p className="mt-4 text-ink-2">
          Ogni {CUTS_FOR_REWARD} tagli hai diritto a <strong className="text-ink">{REWARD_LABEL}</strong>.
        </p>
        <ol className="mt-4 flex gap-2" aria-label={`${card?.cuts ?? 0} tagli su ${CUTS_FOR_REWARD}`}>
          {Array.from({ length: CUTS_FOR_REWARD }).map((_, i) => (
            <li
              key={i}
              aria-hidden
              className={`h-12 flex-1 border-2 ${i < (card?.cuts ?? 0) ? "animate-oscillate-bg border-ink" : "border-line"}`}
            />
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-2">
          {card?.cuts ?? 0} su {CUTS_FOR_REWARD}
          {(card?.rewardsAvailable ?? 0) > 0 && (
            <strong className="ml-2 text-magenta-text">
              Hai {card!.rewardsAvailable} {card!.rewardsAvailable === 1 ? "premio" : "premi"} da usare: dillo a Giulia.
            </strong>
          )}
        </p>
      </section>

      {/* Storico */}
      <section aria-labelledby="storico" className="mt-12">
        <h2 id="storico" className="border-b-2 border-ink pb-2 font-display text-3xl">
          Storico
        </h2>
        {past.length === 0 ? (
          <p className="py-6 text-ink-2">Ancora nessuna visita.</p>
        ) : (
          <ul>
            {past.map((b) => {
              const activeIds = b.items.filter((i) => i.service.active).map((i) => i.serviceId);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
                  <div>
                    <p className="font-semibold">
                      {cap(labelGiornoLungo(romeYmd(b.start)))}
                      <span className="ml-2 text-sm font-normal text-ink-3">{statusLabel[b.status]}</span>
                    </p>
                    <p className="text-ink-2">{b.items.map((i) => i.service.name).join(", ")}</p>
                  </div>
                  {activeIds.length > 0 && (
                    <Link
                      href={`/prenota?servizi=${activeIds.join(",")}`}
                      className="inline-flex min-h-11 items-center px-1 font-semibold underline underline-offset-4 hover:text-blue"
                    >
                      Riprenota
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Preferenze */}
      <section aria-labelledby="preferenze" className="mt-12">
        <h2 id="preferenze" className="border-b-2 border-ink pb-2 font-display text-3xl">
          Preferenze
        </h2>
        <div className="mt-4">
          <ConsentToggle initial={customer.marketingConsent} />
        </div>
      </section>
    </main>
  );
}
