"use client";

import { useState } from "react";

export type LoggedCustomer = { name: string; phone: string };

type Phase = "phone" | "code" | "name";

/** Accesso con cellulare + codice WhatsApp. Il nome si chiede solo ai nuovi clienti. */
export default function LoginForm({ onSuccess }: { onSuccess: (c: LoggedCustomer) => void }) {
  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [normalized, setNormalized] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (url: string, body: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setError(data.message ?? "Errore. Riprova.");
      return res.ok ? data : null;
    } catch {
      setError("Connessione assente. Riprova.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const data = await post("/api/auth/request-code", { phone });
    if (!data) return;
    setNormalized(data.phone);
    setDevCode(data.devCode ?? null);
    setCode("");
    setPhase("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await post("/api/auth/verify", { phone: normalized, code, ...(phase === "name" && { name }) });
    if (!data) return;
    if (data.needsName) {
      setPhase("name");
      return;
    }
    onSuccess(data.customer);
  };

  const input =
    "mt-1 block min-h-12 w-full border border-ink bg-bg px-3 text-lg outline-none focus:border-blue focus:ring-2 focus:ring-blue";
  const button =
    "mt-4 min-h-12 w-full border border-ink bg-ink px-6 font-semibold text-bg transition-colors hover:border-blue hover:bg-blue hover:text-ink disabled:cursor-wait disabled:opacity-60";

  return (
    <div>
      {phase === "phone" && (
        <form onSubmit={requestCode} noValidate>
          <label htmlFor="phone" className="font-semibold">
            Cellulare
          </label>
          <div className="mt-1 flex">
            <span className="flex min-h-12 items-center border border-r-0 border-ink bg-tint px-3 text-lg">+39</span>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="333 123 4567"
              className={`${input} mt-0`}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <button type="submit" disabled={busy || phone.trim().length < 6} className={button}>
            {busy ? "Invio in corso" : "Inviami il codice"}
          </button>
        </form>
      )}

      {(phase === "code" || phase === "name") && (
        <form onSubmit={verify} noValidate>
          {phase === "code" ? (
            <>
              <p className="text-ink-2">
                Codice inviato su WhatsApp al <strong className="text-ink">{normalized}</strong>.
              </p>
              {devCode && (
                <p className="mt-3 border border-dashed border-ink-3 bg-tint px-3 py-2 text-sm">
                  Modalità prova, WhatsApp non ancora collegato. Codice: <strong className="tabular-nums">{devCode}</strong>
                </p>
              )}
              <label htmlFor="code" className="mt-4 block font-semibold">
                Codice a 6 cifre
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${input} tracking-[0.4em] tabular-nums`}
                aria-describedby={error ? "login-error" : undefined}
              />
            </>
          ) : (
            <>
              <p className="text-ink-2">Benvenuta o benvenuto da Level Up. Come ti chiami?</p>
              <label htmlFor="name" className="mt-4 block font-semibold">
                Nome
              </label>
              <input
                id="name"
                autoComplete="given-name"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
                aria-describedby={error ? "login-error" : undefined}
              />
            </>
          )}
          <button
            type="submit"
            disabled={busy || (phase === "code" ? code.length !== 6 : name.trim().length < 2)}
            className={button}
          >
            {busy ? "Verifica in corso" : "Continua"}
          </button>
          {phase === "code" && (
            <div className="mt-4 flex flex-wrap gap-x-6">
              <button type="button" onClick={() => requestCode()} disabled={busy} className="min-h-11 text-sm underline underline-offset-4">
                Invia di nuovo
              </button>
              <button type="button" onClick={() => setPhase("phone")} className="min-h-11 text-sm underline underline-offset-4">
                Cambia numero
              </button>
            </div>
          )}
        </form>
      )}

      {error && (
        <p id="login-error" role="alert" className="mt-4 border-l-4 border-magenta bg-tint px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}
