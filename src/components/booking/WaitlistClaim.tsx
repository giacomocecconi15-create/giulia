"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CardGuarantee, { type CardGuaranteeHandle } from "./CardGuarantee";
import LoginForm from "./LoginForm";

export default function WaitlistClaim({ entryId, logged, minutesLeft }: { entryId: string; logged: boolean; minutesLeft: number }) {
  const [isLogged, setLogged] = useState(logged);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<CardGuaranteeHandle>(null);

  if (done) {
    return (
      <div className="mt-8">
        <p className="font-display text-3xl">Il posto è tuo.</p>
        <p className="mt-2 text-ink-2">Ti arriva la conferma su WhatsApp.</p>
        <Link href="/account" className="mt-6 inline-flex min-h-12 items-center border border-ink px-6 font-semibold hover:bg-ink hover:text-bg">
          Vai al tuo account
        </Link>
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className="mt-8 max-w-sm">
        <p className="mb-4 text-ink-2">Accedi con il numero su cui hai ricevuto l&apos;avviso.</p>
        <LoginForm onSuccess={() => setLogged(true)} />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-ink-2">Il posto è tenuto per te ancora per circa {minutesLeft} minuti.</p>
      <CardGuarantee ref={cardRef} onError={setError} />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          if (cardRef.current && !(await cardRef.current.ensureCard())) return setBusy(false);
          const res = await fetch(`/api/waitlist/${entryId}/claim`, { method: "POST" });
          const data = await res.json();
          setBusy(false);
          if (!res.ok) return setError(data.message ?? "Non è stato possibile prendere il posto.");
          setDone(true);
        }}
        className="mt-6 min-h-12 border border-ink bg-ink px-6 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink disabled:opacity-60"
      >
        {busy ? "Conferma in corso" : "Prendo il posto"}
      </button>
      <p className="mt-3 text-sm text-ink-3">
        Confermando accetti i <Link href="/termini" className="underline">Termini</Link>.
      </p>
      {error && (
        <p role="alert" className="mt-4 border-l-4 border-magenta bg-tint px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}
