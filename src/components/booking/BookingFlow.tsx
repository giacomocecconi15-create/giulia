"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SezioneListino } from "@/lib/data";
import { formatEuro, formatPrezzo } from "@/lib/format";
import { categorie, type Categoria } from "@/data/catalogo";
import CardGuarantee, { type CardGuaranteeHandle } from "./CardGuarantee";
import LoginForm, { type LoggedCustomer } from "./LoginForm";
import ServicePreview, { type ServicePreviewHandle, type VoceCatalogoUI } from "./ServicePreview";
import { readUtm } from "../UtmCapture";

/** "scelta" = servizio con anteprima + giorno e ora; "orario" solo per spostare. */
type Step = "scelta" | "orario" | "accesso" | "conferma" | "fatto";
type Slot = { start: string; time: string };
type Day = { date: string; label: string; longLabel: string; open: boolean; slots: Slot[] };
type Quote = {
  totalCents: number;
  discountCents: number;
  finalCents: number;
  discountPct: number;
  items: { id: string; name: string; priceCents: number; priceFrom: boolean }[];
};
type Done = { date: string; time: string; services: string[]; finalCents: number; discountCents: number };
export type Reschedule = { bookingId: string; serviceIds: string[]; currentLabel: string };

const DAYS_PER_PAGE = 7;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function BookingFlow({
  listino,
  voci,
  promoActive,
  discountPct,
  initialCustomer,
  preselected,
  reschedule,
}: {
  listino: SezioneListino[];
  voci: VoceCatalogoUI[];
  promoActive: boolean;
  discountPct: number;
  initialCustomer: LoggedCustomer | null;
  preselected: string[];
  reschedule?: Reschedule | null;
}) {
  const allServices = useMemo(() => listino.flatMap((s) => s.services), [listino]);
  const [step, setStep] = useState<Step>(reschedule ? "orario" : "scelta");
  const [selected, setSelected] = useState<string[]>(() =>
    reschedule ? reschedule.serviceIds : preselected.filter((id) => allServices.some((s) => s.id === id)),
  );
  // Catalogo: filtro, servizio in anteprima
  const [filtro, setFiltro] = useState<Categoria | "tutti">("tutti");
  const visibili = useMemo(() => (filtro === "tutti" ? voci : voci.filter((v) => v.categorie.includes(filtro))), [voci, filtro]);
  const [previewId, setPreviewId] = useState<string | null>(() => preselected.find((id) => voci.some((v) => v.id === id)) ?? null);
  const previewItem = voci.find((v) => v.id === previewId) ?? null;
  const previewRef = useRef<ServicePreviewHandle>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pendingWaitlist, setPendingWaitlist] = useState<string | null>(null);
  const [waitlistDone, setWaitlistDone] = useState<string[]>([]);
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
  const cardRef = useRef<CardGuaranteeHandle>(null);

  const selectedServices = allServices.filter((s) => selected.includes(s.id));
  const subtotal = selectedServices.reduce((a, s) => a + s.priceCents, 0);
  const servicesParam = selected.join(",");

  // Sposta il focus sul titolo a ogni passaggio (lettori di schermo e tastiera)
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Arrivo con un servizio già scelto (dalla home): anteprima pronta, muta finché non si clicca;
  // sotto lg la pagina va direttamente all'anteprima e ai giorni
  useEffect(() => {
    if (!previewItem) return;
    previewRef.current?.show(previewItem, { play: true, sound: false });
    if (window.innerWidth < 1024) requestAnimationFrame(() => scrollToPanel("auto"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if ((step === "orario" || step === "scelta") && selected.length > 0) loadDays(from);
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

  /** Click su un servizio: lo sceglie, avvia il video con l'audio e mostra subito i giorni. */
  const choose = (item: VoceCatalogoUI) => {
    setSlot(null);
    setSelected([item.id]);
    setPreviewId(item.id);
    previewRef.current?.show(item, { play: true, sound: true });
    revealPanel();
  };

  /** "+": aggiunge (o toglie) un servizio alla stessa prenotazione. */
  const toggleAdd = (item: VoceCatalogoUI) => {
    setSlot(null);
    const adding = !selected.includes(item.id);
    setSelected((cur) => (adding ? [...cur, item.id] : cur.filter((x) => x !== item.id)));
    if (adding) {
      setPreviewId(item.id);
      previewRef.current?.show(item, { play: true, sound: true });
      revealPanel();
    }
  };

  const remove = (id: string) => {
    setSlot(null);
    setSelected((cur) => cur.filter((x) => x !== id));
  };

  /** Porta l'anteprima subito sotto l'intestazione fissa (sotto lg sta sopra l'elenco). */
  const scrollToPanel = (behavior: ScrollBehavior) => {
    const el = panelRef.current;
    if (!el) return;
    const header = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - header - 12, behavior });
  };

  const revealPanel = () => {
    if (window.innerWidth >= 1024) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollToPanel(reduce ? "auto" : "smooth");
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

  const joinWaitlist = async (date: string) => {
    if (!customer) {
      setPendingWaitlist(date);
      setStep("accesso");
      return;
    }
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, serviceIds: selected }),
    });
    if (res.ok) setWaitlistDone((d) => [...d, date]);
    else setNotice((await res.json()).message ?? "Iscrizione non riuscita. Riprova.");
  };

  const confirm = async () => {
    if (!slot) return;
    setSubmitting(true);
    setError(null);
    if (!reschedule && cardRef.current && !(await cardRef.current.ensureCard())) {
      setSubmitting(false);
      return;
    }
    const res = reschedule
      ? await fetch(`/api/bookings/${reschedule.bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: slot.start }),
        })
      : await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceIds: selected, start: slot.start, acceptTerms: terms, utm: readUtm() }),
        });
    const data = await res.json();
    setSubmitting(false);
    if (res.status === 409) {
      setSlot(null);
      setNotice(data.message);
      setStep(reschedule ? "orario" : "scelta");
      loadDays(from);
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

  const steps: { id: Step; label: string }[] = reschedule
    ? [{ id: "orario", label: "Nuovo giorno e ora" }]
    : [
        { id: "scelta", label: "Servizio e orario" },
        ...(initialCustomer ? [] : [{ id: "accesso" as Step, label: "Accesso" }]),
        { id: "conferma", label: "Conferma" },
      ];
  const currentIdx = steps.findIndex((s) => s.id === step);
  const day = days?.[dayIdx];
  const canGoBack = from && today && from > today;
  const canGoForward = from && lastDay && days && days.length === DAYS_PER_PAGE && days.at(-1)!.date < lastDay;

  const dayPicker = (
    <>
          <div className="mt-4 flex items-center justify-between gap-2">
            {step === "scelta" ? <h2 className="font-display text-2xl">Quando vieni?</h2> : <span />}
            <div className="flex">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                disabled={!canGoBack}
                aria-label="Settimana prima"
                className="min-h-11 px-2 text-sm font-semibold underline underline-offset-4 disabled:hidden"
              >
                Prima
              </button>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                disabled={!canGoForward}
                aria-label="Settimana dopo"
                className="min-h-11 px-2 text-sm font-semibold underline underline-offset-4 disabled:hidden"
              >
                Settimana dopo
              </button>
            </div>
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
                    const selectable = free || d.open;
                    const [wd, num, mon] = d.label.split(" ");
                    return (
                      <button
                        key={d.date}
                        type="button"
                        role="radio"
                        aria-checked={i === dayIdx}
                        aria-label={`${d.longLabel}${free ? "" : d.open ? ", pieno" : ", chiuso"}`}
                        disabled={!selectable}
                        onClick={() => {
                          setDayIdx(i);
                          setSlot(null);
                        }}
                        className={`flex min-h-16 flex-col items-center justify-center border text-sm transition-colors ${
                          i === dayIdx
                            ? "border-ink bg-ink text-bg"
                            : free
                              ? "border-line hover:border-ink"
                              : d.open
                                ? "border-line text-ink-3 line-through hover:border-ink"
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
                ) : day?.open ? (
                  <p className="mt-8 text-ink-2">
                    <span className="font-semibold text-ink">{cap(day.longLabel)}</span> è pieno.
                  </p>
                ) : (
                  <p className="mt-8 text-ink-2">Nessun orario libero in questa settimana. Prova la settimana dopo.</p>
                )}

                {day?.open && !reschedule && (
                  <div className="mt-8 border border-line p-4">
                    {waitlistDone.includes(day.date) ? (
                      <p role="status">
                        Sei in lista d&apos;attesa per {day.longLabel}. Se si libera un posto ti scriviamo su WhatsApp e te lo
                        teniamo per 15 minuti.
                      </p>
                    ) : (
                      <>
                        <p>
                          {day.slots.length > 0 ? "Nessun orario ti va bene?" : "Vuoi comunque venire questo giorno?"} Mettiti in
                          lista d&apos;attesa: se si libera un posto {day.longLabel} ti avvisiamo su WhatsApp.
                        </p>
                        <button
                          type="button"
                          onClick={() => joinWaitlist(day.date)}
                          className="mt-3 min-h-11 border border-ink px-4 font-semibold transition-colors hover:bg-ink hover:text-bg"
                        >
                          Avvisami se si libera
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
    </>
  );

  return (
    <div className={`mx-auto px-4 pt-5 pb-10 md:px-8 md:pt-14 md:pb-16 ${step === "scelta" ? "max-w-6xl" : "max-w-3xl"}`}>
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

      {/* 1. Servizio (con anteprima del lavoro) e subito giorno e ora */}
      {step === "scelta" && (
        <section aria-labelledby="titolo-step" className="mt-6 md:mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-[2rem] leading-tight outline-none focus-visible:outline-none md:text-5xl">
            Prenota
          </h1>
          <p className="mt-2 max-w-xl text-ink-2">Scegli un servizio: guardi il lavoro di Giulia e scegli subito giorno e ora.</p>
          {notice && (
            <p role="alert" className="mt-4 border-l-4 border-magenta bg-tint px-4 py-3">
              {notice}
            </p>
          )}

          <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-start lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,4fr)]">
            {/* Pannello: anteprima + servizi scelti, giorni e orari.
                Mobile: sopra l'elenco. Tablet: colonna destra. Desktop: due colonne (lg:contents). */}
            <div className={`md:order-2 lg:contents ${selected.length === 0 && !previewItem ? "hidden md:block" : ""}`}>
              <div ref={panelRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:order-2 lg:self-start">
                <ServicePreview ref={previewRef} item={previewItem} />
              </div>

              <div className="mt-3 lg:sticky lg:top-24 lg:order-3 lg:mt-0 lg:self-start">
                {selected.length > 0 ? (
                  <>
                    <h2 className="sr-only">Servizi scelti</h2>
                    <ul className={`flex-wrap gap-2 ${selected.length === 1 && selected[0] === previewId ? "hidden lg:flex" : "flex"}`}>
                      {selectedServices.map((s) => (
                        <li key={s.id} className="flex items-center border border-ink">
                          <span className="py-1.5 pl-3 font-semibold">
                            {s.name} <span className="font-normal text-ink-2 tabular-nums">{formatPrezzo(s)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(s.id)}
                            aria-label={`Togli ${s.name}`}
                            className="flex min-h-11 min-w-11 items-center justify-center text-xl leading-none hover:bg-ink hover:text-bg"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 hidden text-sm text-ink-3 lg:block">Vuoi aggiungere altro? Usa il pulsante + accanto al servizio.</p>
                    {dayPicker}
                  </>
                ) : (
                  <p className="hidden border border-dashed border-line p-6 text-ink-3 lg:block">
                    Qui compaiono i giorni e gli orari liberi per il servizio che scegli.
                  </p>
                )}
              </div>
            </div>

            {/* Elenco servizi con filtri */}
            <div className="md:order-1 lg:order-1">
              <div role="group" aria-label="Filtra per categoria" className="flex flex-wrap gap-2">
                {categorie.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={filtro === c.id}
                    onClick={() => setFiltro(c.id)}
                    className={`min-h-11 border px-4 font-semibold transition-colors ${
                      filtro === c.id ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <ul className="mt-4 border-t border-line" aria-label="Servizi">
                {visibili.map((v) => {
                  const on = selected.includes(v.id);
                  const viewing = v.id === previewId;
                  return (
                    <li key={v.id} className="flex items-stretch border-b border-line">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => choose(v)}
                        className={`group flex min-h-14 flex-1 items-center gap-3 py-3 text-left transition-colors ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}
                      >
                        <span aria-hidden className={`h-8 w-1 shrink-0 transition-colors ${viewing ? "animate-oscillate-bg" : on ? "bg-ink" : "bg-transparent group-hover:bg-line"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-lg ${on ? "font-bold" : ""}`}>{v.name}</span>
                          {promoActive && v.promoEligible && (
                            <span className="text-sm font-semibold text-magenta-text">prima visita -{discountPct}%</span>
                          )}
                        </span>
                        <span className="font-semibold whitespace-nowrap tabular-nums">{v.priceLabel}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAdd(v)}
                        aria-pressed={on}
                        aria-label={on ? `Togli ${v.name} dalla prenotazione` : `Aggiungi ${v.name} alla prenotazione`}
                        className={`ml-2 flex w-11 shrink-0 items-center justify-center self-center border text-xl leading-none transition-colors min-h-11 ${
                          on ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"
                        }`}
                      >
                        {on ? "✓" : "+"}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <ul className="mt-8 space-y-1 text-sm text-ink-3">
                <li>Prezzi in euro, IVA inclusa. Paghi in salone, dopo il servizio.</li>
                <li>Puoi prenotare più servizi insieme con il pulsante +.</li>
                {promoActive && (
                  <li>
                    -{discountPct}% sulla prima visita su taglio donna, taglio uomo e piega.{" "}
                    <Link href="/termini#promozione" className="underline underline-offset-2 hover:text-blue">
                      Condizioni
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 2. Giorno e ora */}
      {step === "orario" && (
        <section aria-labelledby="titolo-step" className="mt-6 md:mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-[2rem] leading-tight outline-none focus-visible:outline-none md:text-5xl">
            {reschedule ? "Spostiamo l'appuntamento" : "Quando vieni?"}
          </h1>
          <p className="mt-2 text-ink-2">{selectedServices.map((s) => s.name).join(", ")}</p>
          {reschedule && <p className="mt-1 text-ink-2">Ora: {reschedule.currentLabel}</p>}
          {notice && (
            <p role="alert" className="mt-4 border-l-4 border-magenta bg-tint px-4 py-3">
              {notice}
            </p>
          )}

          {dayPicker}
        </section>
      )}

      {/* 3. Accesso */}
      {step === "accesso" && (
        <section aria-labelledby="titolo-step" className="mt-6 md:mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-[2rem] leading-tight outline-none focus-visible:outline-none md:text-5xl">
            Il tuo cellulare
          </h1>
          <p className="mt-2 max-w-lg text-ink-2">
            Ti mandiamo un codice su WhatsApp. Niente email e niente password: la prossima volta ti riconosciamo.
          </p>
          <div className="mt-8 max-w-sm">
            <LoginForm
              onSuccess={async (c) => {
                setCustomer(c);
                if (pendingWaitlist) {
                  const res = await fetch("/api/waitlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date: pendingWaitlist, serviceIds: selected }),
                  });
                  if (res.ok) setWaitlistDone((d) => [...d, pendingWaitlist]);
                  setPendingWaitlist(null);
                  setStep("scelta");
                  return;
                }
                setStep("conferma");
              }}
            />
          </div>
        </section>
      )}

      {/* 4. Conferma */}
      {step === "conferma" && slot && (
        <section aria-labelledby="titolo-step" className="mt-6 md:mt-10">
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="font-display text-[2rem] leading-tight outline-none focus-visible:outline-none md:text-5xl">
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

          <CardGuarantee ref={cardRef} onError={setError} />

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
          <h1 id="titolo-step" ref={headingRef} tabIndex={-1} className="mt-6 font-display text-5xl outline-none focus-visible:outline-none">
            {reschedule ? "Appuntamento spostato" : "Ci vediamo!"}
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
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:-mx-8">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
            <div className="min-w-0 text-sm">
              {step === "scelta" && (
                <p>
                  {selected.length === 0 ? (
                    <span className="text-ink-3">Scegli un servizio</span>
                  ) : slot ? (
                    <strong>{`${cap(slot.longLabel)}, ${slot.time}`}</strong>
                  ) : (
                    <>
                      <strong>{selectedServices.map((s) => s.name).join(", ")}</strong>, {formatEuro(subtotal)}
                      <span className="block text-ink-3">Scegli giorno e ora</span>
                    </>
                  )}
                </p>
              )}
              {step === "orario" && (
                <p>{slot ? <strong>{`${cap(slot.longLabel)}, ${slot.time}`}</strong> : <span className="text-ink-3">Scegli un orario</span>}</p>
              )}
              {step === "conferma" && (
                <button
                  type="button"
                  onClick={() => setStep("scelta")}
                  className="min-h-11 font-semibold underline underline-offset-4"
                >
                  Indietro
                </button>
              )}
            </div>
            {step === "scelta" && (
              <PrimaryButton disabled={!slot} onClick={() => setStep(customer ? "conferma" : "accesso")}>
                Prenota
              </PrimaryButton>
            )}
            {step === "orario" && reschedule && (
              <PrimaryButton disabled={!slot || submitting} onClick={confirm}>
                {submitting ? "Spostamento in corso" : "Sposta qui"}
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
        <button type="button" onClick={() => setStep("scelta")} className="mt-8 min-h-11 font-semibold underline underline-offset-4">
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
