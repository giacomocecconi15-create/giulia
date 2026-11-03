"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

type Consent = "accepted" | "rejected" | null;

const COOKIE = "lu_consent";
/**
 * Versione dell'informativa cookie: aumentarla quando cambiano cookie o finalità,
 * così il banner viene ripresentato a tutti.
 */
export const CONSENT_VERSION = 1;
const MAX_AGE_DAYS = 180; // 6 mesi, come da linee guida del Garante (2021)
export const OPEN_PREFS_EVENT = "lu:open-cookie-prefs";

/** Formato: v<versione>.<accepted|rejected>.<giorno della scelta>. Tutto il resto vale come "nessuna scelta". */
export function parseConsent(raw: string | undefined, today = Math.floor(Date.now() / 86_400_000)): Consent {
  const m = raw?.match(/^v(\d+)\.(accepted|rejected)\.(\d+)$/);
  if (!m) return null;
  const [, version, value, day] = m;
  if (Number(version) !== CONSENT_VERSION) return null;
  if (today - Number(day) > MAX_AGE_DAYS || Number(day) > today + 1) return null;
  return value as Consent;
}

function readConsent(): Consent {
  const m = document.cookie.match(/(?:^|; )lu_consent=([^;]+)/);
  return parseConsent(m ? decodeURIComponent(m[1]) : undefined);
}

function writeConsent(value: Exclude<Consent, null>) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const day = Math.floor(Date.now() / 86_400_000);
  document.cookie = `${COOKIE}=v${CONSENT_VERSION}.${value}.${day}; Max-Age=${MAX_AGE_DAYS * 86_400}; Path=/; SameSite=Lax${secure}`;
}

/** Al rifiuto o alla revoca: cancella i cookie di misurazione e marketing eventualmente presenti. */
function clearTrackingCookies() {
  const names = document.cookie.split("; ").map((c) => c.split("=")[0]).filter((n) => /^(_ga|_gid|_gat|_fbp|_fbc)/.test(n));
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const n of names) for (const d of domains) document.cookie = `${n}=; Max-Age=0; Path=/${d ? `; Domain=${d}` : ""}`;
}

/** Registra in forma anonima solo la scelta (prova del consenso, nessun dato personale). */
function logChoice(value: string) {
  try {
    navigator.sendBeacon?.("/api/track", new Blob([JSON.stringify({ type: "cookie_consent", ref: `v${CONSENT_VERSION}:${value}` })], { type: "application/json" }));
  } catch {
    /* niente */
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Banner cookie con "Accetta" e "Rifiuta" di pari evidenza.
 * Google Analytics e Pixel Meta vengono caricati SOLO dopo "Accetta".
 */
export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = readConsent();
    setConsent(c);
    setOpen(c === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_PREFS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, reopen);
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    const revoked = consent === "accepted" && value === "rejected";
    writeConsent(value);
    logChoice(value);
    if (value === "rejected") clearTrackingCookies();
    setConsent(value);
    setOpen(false);
    // Gli script già caricati non si possono scaricare: si ricarica la pagina.
    if (revoked) location.reload();
  };

  return (
    <>
      {consent === "accepted" && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consent === "accepted" && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {open && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="max-w-2xl">
              <h2 id="cookie-title" className="font-display text-xl">
                Cookie
              </h2>
              <p className="mt-1 text-sm text-ink-2">
                Usiamo cookie tecnici per far funzionare il sito. Con il tuo consenso usiamo anche cookie di
                misurazione e marketing (Google Analytics, Meta). Puoi cambiare idea in qualsiasi momento.{" "}
                <Link href="/cookie" className="underline underline-offset-2 hover:text-blue">
                  Dettagli
                </Link>
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => choose("rejected")}
                className="min-h-11 min-w-32 border border-ink bg-bg px-5 font-semibold text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                Rifiuta
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="min-h-11 min-w-32 border border-ink bg-bg px-5 font-semibold text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                Accetta
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
