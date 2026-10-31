/** Canali online del file di monitoraggio (foglio Clienti, colonna Fonte). */
export const ONLINE_SOURCES = ["Instagram", "Facebook", "TikTok", "Google Maps / Ricerca", "Sito web"] as const;

/**
 * Converte utm_source (o il dominio di provenienza) nella "Fonte" del file Excel.
 * Esempi: ig, instagram -> Instagram; gmb, google, maps -> Google Maps / Ricerca.
 */
export function sourceLabel(source: string | null | undefined): string {
  const s = (source ?? "").toLowerCase();
  if (!s || s === "online" || s === "sito" || s === "direct") return "Sito web";
  if (/^(ig|instagram)/.test(s) || s.includes("instagram")) return "Instagram";
  if (/^(fb|facebook|meta)/.test(s) || s.includes("facebook")) return "Facebook";
  if (s.includes("tiktok")) return "TikTok";
  if (/(google|gmb|maps|gbp)/.test(s)) return "Google Maps / Ricerca";
  if (s.includes("whatsapp")) return "WhatsApp";
  if (s === "telefono") return "Telefono";
  if (s === "lista_attesa") return "Sito web";
  return source!;
}

export const isOnlineSource = (label: string) => (ONLINE_SOURCES as readonly string[]).includes(label);

/** Provenienza dal referrer quando mancano gli UTM. */
export function sourceFromReferrer(referrer: string, ownHost: string): string | null {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || host === ownHost) return null;
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook") || host === "fb.me" || host === "l.facebook.com") return "facebook";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("google")) return "google";
    return host;
  } catch {
    return null;
  }
}
