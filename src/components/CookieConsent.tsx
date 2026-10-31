"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

type Consent = "accepted" | "rejected" | null;

const COOKIE = "lu_consent";
const MAX_AGE = 60 * 60 * 24 * 180; // 6 mesi
export const OPEN_PREFS_EVENT = "lu:open-cookie-prefs";

function readConsent(): Consent {
  const m = document.cookie.match(/(?:^|; )lu_consent=(accepted|rejected)/);
  return (m?.[1] as Consent) ?? null;
}

function writeConsent(value: Exclude<Consent, null>) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
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
