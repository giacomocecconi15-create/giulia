"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type CardGuaranteeHandle = { ensureCard: () => Promise<boolean> };

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= pk ? loadStripe(pk, { locale: "it" }) : Promise.resolve(null));

type SavedCard = { brand: string; last4: string; exp: string };

const appearance = {
  theme: "flat" as const,
  variables: {
    colorPrimary: "#0E1A22",
    colorText: "#0E1A22",
    colorBackground: "#FCFFFF",
    colorDanger: "#A31A6B",
    fontFamily: "Karla, system-ui, sans-serif",
    borderRadius: "0px",
  },
  rules: { ".Input": { border: "1px solid #0E1A22" }, ".Input:focus": { border: "1px solid #0593C6", boxShadow: "none" } },
};

/**
 * Carta a garanzia: salva la carta con un SetupIntent, senza addebito.
 * Senza chiavi Stripe mostra un avviso di modalità prova.
 */
const CardGuarantee = forwardRef<CardGuaranteeHandle, { onError: (msg: string | null) => void }>(function CardGuarantee(
  { onError },
  ref,
) {
  const [state, setState] = useState<"loading" | "disabled" | "saved" | "form">("loading");
  const [card, setCard] = useState<SavedCard | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const inner = useRef<CardGuaranteeHandle>(null);

  const openForm = async () => {
    setState("loading");
    const res = await fetch("/api/stripe/setup-intent", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      onError(data.message);
      setState(card ? "saved" : "form");
      return;
    }
    setClientSecret(data.clientSecret);
    setState("form");
  };

  useEffect(() => {
    fetch("/api/stripe/setup-intent")
      .then((r) => r.json())
      .then((d) => {
        if (!d.enabled) return setState("disabled");
        if (d.card) {
          setCard(d.card);
          setState("saved");
        } else openForm();
      })
      .catch(() => setState("disabled"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    ensureCard: async () => {
      if (state === "disabled" || state === "saved") return true;
      if (state === "form" && inner.current) return inner.current.ensureCard();
      return false;
    },
  }));

  return (
    <section aria-labelledby="carta-title" className="mt-8 border border-line p-4">
      <h2 id="carta-title" className="text-lg font-bold">
        Carta a garanzia
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        Nessun addebito e nessun importo bloccato. Viene usata solo in caso di mancata presentazione o disdetta nelle ultime 24
        ore, come previsto dai Termini.
      </p>

      {state === "loading" && <div className="mt-4 h-24 animate-skeleton bg-tint" aria-label="Caricamento" />}

      {state === "disabled" && (
        <p className="mt-4 border border-dashed border-ink-3 bg-tint px-3 py-2 text-sm">
          Modalità prova: Stripe non è ancora collegato, la carta non viene richiesta.
        </p>
      )}

      {state === "saved" && card && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p>
            <span className="capitalize">{card.brand}</span> che termina con <strong className="tabular-nums">{card.last4}</strong>{" "}
            <span className="text-ink-3">(scad. {card.exp})</span>
          </p>
          <button type="button" onClick={openForm} className="min-h-11 text-sm font-semibold underline underline-offset-4">
            Usa un&apos;altra carta
          </button>
        </div>
      )}

      {state === "form" && clientSecret && (
        <div className="mt-4">
          <Elements stripe={getStripe()} options={{ clientSecret, appearance, locale: "it" }}>
            <CardForm ref={inner} onError={onError} />
          </Elements>
        </div>
      )}
    </section>
  );
});

export default CardGuarantee;

const CardForm = forwardRef<CardGuaranteeHandle, { onError: (msg: string | null) => void }>(function CardForm({ onError }, ref) {
  const stripe = useStripe();
  const elements = useElements();
  useImperativeHandle(ref, () => ({
    ensureCard: async () => {
      if (!stripe || !elements) return false;
      onError(null);
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });
      if (error) {
        onError(error.message ?? "Carta non valida.");
        return false;
      }
      const res = await fetch("/api/stripe/save-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupIntentId: setupIntent?.id }),
      });
      if (!res.ok) {
        onError((await res.json()).message);
        return false;
      }
      return true;
    },
  }));
  return <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />;
});
