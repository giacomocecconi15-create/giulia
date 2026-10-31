"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LoginForm from "../booking/LoginForm";

export function AccountLogin() {
  const router = useRouter();
  return <LoginForm onSuccess={() => router.refresh()} />;
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
      }}
      className="min-h-11 font-semibold underline underline-offset-4 hover:text-blue"
    >
      Esci
    </button>
  );
}

export function CancelButton({ bookingId, late }: { bookingId: string; late: boolean }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="min-h-11 border border-ink px-4 font-semibold transition-colors hover:bg-ink hover:text-bg"
      >
        Disdici
      </button>
    );
  }
  return (
    <div role="alertdialog" aria-labelledby={`cancel-${bookingId}`} className="w-full border-l-4 border-magenta bg-tint p-4">
      <p id={`cancel-${bookingId}`}>
        {late
          ? "Mancano meno di 24 ore: come da Termini potrebbe esserti addebitato il valore del servizio. Vuoi disdire lo stesso?"
          : "Vuoi davvero disdire? La disdetta è gratuita."}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
            const data = await res.json();
            setBusy(false);
            if (!res.ok) return setError(data.message ?? "Errore. Riprova.");
            router.refresh();
          }}
          className="min-h-11 border border-ink bg-ink px-4 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink"
        >
          {busy ? "Disdetta in corso" : "Sì, disdici"}
        </button>
        <button type="button" onClick={() => setAsking(false)} className="min-h-11 px-2 font-semibold underline underline-offset-4">
          No, tienila
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-magenta-text">{error}</p>}
    </div>
  );
}

export function ConsentToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={on}
        onChange={async (e) => {
          const value = e.target.checked;
          setOn(value);
          setSaved(false);
          await fetch("/api/account/consent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marketing: value }),
          });
          setSaved(true);
        }}
        className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
      />
      <span>
        Voglio ricevere su WhatsApp un promemoria quando è ora di tornare e la richiesta di una recensione dopo la visita.
        <span className="block text-sm text-ink-3" aria-live="polite">
          {saved ? "Preferenza salvata." : "Puoi cambiare idea quando vuoi."}
        </span>
      </span>
    </label>
  );
}
