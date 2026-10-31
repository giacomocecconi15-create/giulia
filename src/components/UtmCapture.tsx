"use client";

import { useEffect } from "react";
import { sourceFromReferrer } from "@/lib/attribution";

export const UTM_KEY = "lu_utm";
export type Utm = { source: string; medium?: string; campaign?: string };

/**
 * Salva la provenienza della visita (utm_* o referrer) in sessionStorage,
 * solo per questa scheda. Viene inviata con la prenotazione (§7).
 */
export default function UtmCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search);
      const source = p.get("utm_source");
      if (source) {
        const utm: Utm = { source, medium: p.get("utm_medium") ?? undefined, campaign: p.get("utm_campaign") ?? undefined };
        sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
        return;
      }
      if (!sessionStorage.getItem(UTM_KEY) && document.referrer) {
        const ref = sourceFromReferrer(document.referrer, location.hostname.replace(/^www\./, ""));
        if (ref) sessionStorage.setItem(UTM_KEY, JSON.stringify({ source: ref, medium: "referral" }));
      }
    } catch {
      /* storage non disponibile */
    }
  }, []);
  return null;
}

export function readUtm(): Utm | null {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "null");
  } catch {
    return null;
  }
}
