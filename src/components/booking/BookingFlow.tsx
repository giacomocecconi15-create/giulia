"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SezioneListino } from "@/lib/data";
import { formatEuro, formatPrezzo } from "@/lib/format";
import LoginForm, { type LoggedCustomer } from "./LoginForm";

type Step = "servizi" | "orario" | "accesso" | "conferma" | "fatto";
type Slot = { start: string; time: string };
type Day = { date: string; label: string; longLabel: string; slots: Slot[] };
type Quote = {
  totalCents: number;
  discountCents: number;
  finalCents: number;
  discountPct: number;
  items: { id: string; name: string; priceCents: number; priceFrom: boolean }[];
};
type Done = { date: string; time: string; services: string[]; finalCents: number; discountCents: number };

const DAYS_PER_PAGE = 7;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function BookingFlow({
  listino,
  promoActive,
  discountPct,
  initialCustomer,
  preselected,
}: {
  listino: SezioneListino[];
  promoActive: boolean;
  discountPct: number;
  initialCustomer: LoggedCustomer | null;
  preselected: string[];
}) {
  const allServices = useMemo(() => listino.flatMap((s) => s.services), [listino]);
  const [step, setStep] = useState<Step>("servizi");
  const [selected, setSelected] = useState<string[]>(() => preselected.filter((id) => allServices.some((s) => s.id === id)));
  const [customer, setCustomer] = useState<LoggedCustomer | null>(initialCustomer);
  const [from, setFrom] = useState<string | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [lastDay, setLastDay] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<(Slot & { longLabel: string }) | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const selectedServices = allServices.filter((s) => selected.includes(s.id));
  const subtotal = selectedServices.reduce((a, s) => a + s.priceCents, 0);
  const servicesParam = selected.join(",");

  // Sposta il focus sul titolo a ogni passaggio (lettori di schermo e tastiera)
  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const loadDays = useCallback(
    async (start: string | null) => {
      setDays(null);
      setError(null);
      const q = new URLSearchParams({ services: servicesParam, days: String(DAYS_PER_PAGE), ...(start && { from: start }) });
      const res = await fetch(`/api/availability?${q}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Errore nel caricamento degli orari.");
        setDays([]);
        return;
      }
      setDays(data.days);
      setLastDay(data.lastDay);
      setToday(data.today);
      setFrom(data.days[0]?.date ?? start);
      const first = (data.days as Day[]).findIndex((d) => d.slots.length > 0);
      setDayIdx(first >= 0 ? first : 0);
    },
    [servicesParam],
  );

  useEffect(() => {
    if (step === "orario") loadDays(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, servicesParam]);

  useEffect(() => {
    if (step !== "conferma") return;
    setQuote(null);
    fetch(`/api/quote?services=${servicesParam}`)
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => setError("Errore nel calcolo del riepilogo."));
  }, [step, servicesParam, customer]);

  const toggle = (id: string) => {
    setSlot(null);
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const shiftWeek = (dir: 1 | -1) => {
    if (!from) return;
    const d = new Date(`${from}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dir * DAYS_PER_PAGE);
    const next = d.toISOString().slice(0, 10);
    setSlot(null);
    setFrom(next);
    loadDays(next);
  };

  const confirm = async () => {
    if (!slot) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceIds: selected, start: slot.start, acceptTerms: terms }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.status === 409) {
      setSlot(null);
      setNotice(data.message);
      setStep("orario");
      return;
    }
    if (res.status === 401) {
      setCustomer(null);
      setStep("accesso");
      return;
    }
    if (!res.ok) {
      setError(data.message);
      return;
    }
    setDone(data);
    setStep("fatto");
  };

  const steps: { id: Step; label: string }[] = [
    { id: "servizi", label: "Servizi" },
    { id: "orario", label: "Giorno e ora" },
    ...(initialCustomer ? [] : [{ id: "accesso" as Step, label: "Accesso" }]),
    { id: "conferma", label: "Conferma" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);
  const day = days?.[dayIdx];
  const canGoBack = from && today && from > today;
  const canGoForward = from && lastDay && days && days.length === DAYS_PER_PAGE && days.at(-1)!.date < lastDay;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 md:px-8 md:pt-14">
      {step !== "fatto" && (
        <nav aria-label="Passaggi della prenotazione">
          <ol className="flex gap-1 text-sm">
            {steps.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === currentIdx ? "step" : undefined}
                className={`flex-1 border-t-4 pt-2 ${i <= currentIdx ? "border-ink text-ink" : "border-line text-ink-3"} ${i === currentIdx ? "font-bold" : ""}`}
              >
                <span className="sr-only">Passaggio {i + 1}: </span>
                {s.label}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* 1. Servizi */}
      {step === "servizi" && (
        <section aria-labelledby="titolo-step" className="mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none md:text-5xl">
            Cosa facciamo?
          </h1>
          <p className="mt-2 text-ink-2">Puoi scegliere più servizi.</p>
          {listino.map((sezione) => (
            <fieldset key={sezione.id} className="mt-8">
              <legend className="w-full border-b-2 border-ink pb-2 font-display text-2xl">{sezione.name}</legend>
              <ul>
                {sezione.services.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <li key={s.id} className="border-b border-line">
                      <label className={`flex min-h-14 cursor-pointer items-center gap-4 py-2 transition-colors ${on ? "text-ink" : "hover:text-blue"}`}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(s.id)}
                          className="h-5 w-5 shrink-0 accent-ink"
                        />
                        <span className="flex-1">
                          {s.name}
                          {promoActive && s.promoEligible && (
                            <span className="ml-2 text-sm font-semibold text-magenta-text">prima visita -{discountPct}%</span>
                          )}
                        </span>
                        <span className="font-semibold tabular-nums">{formatPrezzo(s)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
        </section>
      )}

      {/* 2. Giorno e ora */}
      {step === "orario" && (
        <section aria-labelledby="titolo-step" className="mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none md:text-5xl">
            Quando vieni?
          </h1>
          <p className="mt-2 text-ink-2">{selectedServices.map((s) => s.name).join(", ")}</p>
          {notice && (
            <p role="alert" className="mt-4 border-l-4 border-magenta bg-tint px-4 py-3">
              {notice}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              disabled={!canGoBack}
              className="min-h-11 px-2 font-semibold underline underline-offset-4 disabled:invisible"
            >
              Settimana prima
            </button>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              disabled={!canGoForward}
              className="min-h-11 px-2 font-semibold underline underline-offset-4 disabled:invisible"
            >
              Settimana dopo
            </button>
          </div>

          <div aria-busy={!days} aria-live="polite">
            {!days ? (
              <div aria-label="Caricamento orari">
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-16 animate-skeleton bg-tint" />
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-12 animate-skeleton bg-tint" />
                  ))}
                </div>
              </div>
            ) : days.length === 0 ? (
              <p className="mt-6 text-ink-2">{error ?? "Nessun giorno disponibile."}</p>
            ) : (
              <>
                <div role="radiogroup" aria-label="Giorno" className="mt-3 grid grid-cols-7 gap-1">
                  {days.map((d, i) => {
                    const free = d.slots.length > 0;
                    const [wd, num, mon] = d.label.split(" ");
                    return (
                      <button
                        key={d.date}
                        type="button"
                        role="radio"
                        aria-checked={i === dayIdx}
                        aria-label={`${d.longLabel}${free ? "" : ", nessun orario libero"}`}
                        disabled={!free}
                        onClick={() => {
                          setDayIdx(i);
                          setSlot(null);
                        }}
                        className={`flex min-h-16 flex-col items-center justify-center border text-sm transition-colors ${
                          i === dayIdx
                            ? "border-ink bg-ink text-bg"
                            : free
                              ? "border-line hover:border-ink"
                              : "border-transparent text-ink-3 line-through"
                        }`}
                      >
                        <span className="capitalize">{wd}</span>
                        <span className="font-display text-xl leading-tight">{num}</span>
                        <span>{mon}</span>
                      </button>
                    );
                  })}
                </div>

                {day && day.slots.length > 0 ? (
                  <fieldset className="mt-8">
                    <legend className="font-semibold first-letter:uppercase">{day.longLabel}</legend>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {day.slots.map((s) => {
                        const on = slot?.start === s.start;
                        return (
                          <button
                            key={s.start}
                            type="button"
                            aria-pressed={on}
                            onClick={() => {
                              setSlot({ ...s, longLabel: day.longLabel });
                              setNotice(null);
                            }}
                            className={`min-h-12 border font-semibold tabular-nums transition-colors ${
                              on ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"
                            }`}
                          >
                            {s.time}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : (
                  <p className="mt-8 text-ink-2">Nessun orario libero in questa settimana. Prova la settimana dopo.</p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* 3. Accesso */}
      {step === "accesso" && (
        <section aria-labelledby="titolo-step" className="mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none md:text-5xl">
            Il tuo cellulare
          </h1>
          <p className="mt-2 max-w-lg text-ink-2">
            Ti mandiamo un codice su WhatsApp. Niente email e niente password: la prossima volta ti riconosciamo.
          </p>
          <div className="mt-8 max-w-sm">
            <LoginForm
              onSuccess={(c) => {
                setCustomer(c);
                setStep("conferma");
              }}
            />
          </div>
        </section>
      )}

      {/* 4. Conferma */}
      {step === "conferma" && slot && (
        <section aria-labelledby="titolo-step" className="mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-4xl outline-none md:text-5xl">
            Riepilogo
          </h1>
          {customer && <p className="mt-2 text-ink-2">Prenoti come {customer.name}.</p>}

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-line py-4">
            <dt className="text-ink-3">Quando</dt>
            <dd className="font-semibold">
              {cap(slot.longLabel)}, ore {slot.time}
            </dd>
            <dt className="text-ink-3">Dove</dt>
            <dd>Level Up, Strada Adriatica 109, Pesaro</dd>
          </dl>

          {!quote ? (
            <div className="mt-6 space-y-2" aria-label="Calcolo del riepilogo">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 animate-skeleton bg-tint" />
              ))}
            </div>
          ) : (
            <table className="mt-6 w-full text-left">
              <caption className="sr-only">Servizi e prezzi</caption>
              <tbody>
                {quote.items.map((i) => (
                  <tr key={i.id} className="border-b border-line">
                    <th scope="row" className="py-2 font-normal">
                      {i.name}
                    </th>
                    <td className="py-2 text-right tabular-nums">{formatPrezzo(i)}</td>
                  </tr>
                ))}
                {quote.discountCents > 0 && (
                  <tr className="border-b border-line">
                    <th scope="row" className="py-2 font-normal text-magenta-text">
                      Sconto prima visita -{quote.discountPct}%
                    </th>
                    <td className="py-2 text-right text-magenta-text tabular-nums">-{formatEuro(quote.discountCents)}</td>
                  </tr>
                )}
                <tr>
                  <th scope="row" className="pt-3 text-lg">
                    Totale {quote.items.some((i) => i.priceFrom) ? "indicativo" : ""}
                  </th>
                  <td className="pt-3 text-right text-lg font-bold tabular-nums">{formatEuro(quote.finalCents)}</td>
                </tr>
              </tbody>
            </table>
          )}
          <p className="mt-2 text-sm text-ink-3">Paghi in salone, dopo il servizio.</p>

          <div className="mt-8 border border-dashed border-line bg-tint p-4 text-sm text-ink-2">
            <strong className="text-ink">Carta a garanzia.</strong> Qui salverai una carta: nessun addebito e nessun importo
            bloccato. In arrivo nella prossima fase.
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
              required
            />
            <span>
              Ho letto e accetto i{" "}
              <Link href="/termini" target="_blank" className="underline underline-offset-2 hover:text-blue">
                Termini
              </Link>
              , inclusa la disdetta gratuita fino a 24 ore prima, e l&apos;
              <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-blue">
                informativa privacy
              </Link>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-4 border-l-4 border-magenta bg-tint px-4 py-3">
              {error}
            </p>
          )}
        </section>
      )}

      {/* 5. Fatto */}
      {step === "fatto" && done && (
        <section aria-labelledby="titolo-step" className="mt-6 text-center">
          <span className="mx-auto block h-1 w-16 animate-oscillate-bg" aria-hidden />
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="mt-6 font-display text-5xl outline-none">
            Ci vediamo!
          </h1>
          <p className="mt-4 text-xl">
            {cap(done.date)}, ore <strong>{done.time}</strong>
          </p>
          <p className="mt-2 text-ink-2">{done.services.join(", ")}</p>
          <p className="mt-2 text-ink-2">
            Totale {formatEuro(done.finalCents)}
            {done.discountCents > 0 && `, con lo sconto prima visita di ${formatEuro(done.discountCents)}`}
          </p>
          <p className="mx-auto mt-6 max-w-md text-ink-2">
            Ti arriva la conferma su WhatsApp e un promemoria il giorno prima. Puoi spostare o disdire gratis fino a 24 ore
            prima.
          </p>
          <Link
            href="/"
            className="mt-10 inline-flex min-h-12 items-center border border-ink px-6 font-semibold transition-colors hover:bg-ink hover:text-bg"
          >
            Torna alla home
          </Link>
        </section>
      )}

      {/* Barra azioni */}
      {step !== "fatto" && step !== "accesso" && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-10 border-t border-line bg-bg md:-mx-8">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
            <div className="min-w-0 text-sm">
              {step === "servizi" && (
                <p>
                  {selected.length === 0 ? (
                    <span className="text-ink-3">Nessun servizio scelto</span>
                  ) : (
                    <>
                      <strong>{selected.length}</strong> {selected.length === 1 ? "servizio" : "servizi"},{" "}
                      {formatEuro(subtotal)}
                    </>
                  )}
                </p>
              )}
              {step === "orario" && (
                <p>{slot ? <strong>{`${cap(slot.longLabel)}, ${slot.time}`}</strong> : <span className="text-ink-3">Scegli un orario</span>}</p>
              )}
              {step !== "servizi" && (
                <button
                  type="button"
                  onClick={() => setStep(step === "conferma" ? "orario" : "servizi")}
                  className="min-h-11 font-semibold underline underline-offset-4"
                >
                  Indietro
                </button>
              )}
            </div>
            {step === "servizi" && (
              <PrimaryButton disabled={selected.length === 0} onClick={() => setStep("orario")}>
                Scegli l&apos;orario
              </PrimaryButton>
            )}
            {step === "orario" && (
              <PrimaryButton disabled={!slot} onClick={() => setStep(customer ? "conferma" : "accesso")}>
                Prenota
              </PrimaryButton>
            )}
            {step === "conferma" && (
              <PrimaryButton disabled={!terms || !quote || submitting} onClick={confirm}>
                {submitting ? "Conferma in corso" : "Conferma prenotazione"}
              </PrimaryButton>
            )}
          </div>
        </div>
      )}
      {step === "accesso" && (
        <button type="button" onClick={() => setStep("orario")} className="mt-8 min-h-11 font-semibold underline underline-offset-4">
          Indietro
        </button>
      )}
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-12 shrink-0 border border-ink bg-ink px-6 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-ink-3"
    >
      {children}
    </button>
  );
}
