/**
 * Dati dell'attività. Quelli marcati DA CONFERMARE vanno verificati
 * con Giulia prima del lancio (docs/HANDOFF.md §9).
 */
export const site = {
  name: "Level Up Hair Salon & Barber Shop",
  shortName: "Level Up",
  /** Indirizzo pubblico: SITE_URL se impostato, altrimenti quello di Vercel. */
  url:
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /** Google e motori AI indicizzano il sito solo con ALLOW_INDEXING=1 (al lancio). */
  indexing: process.env.ALLOW_INDEXING === "1",
  description:
    "Parrucchiere e barber shop a Pesaro, in Strada Adriatica 109. Taglio donna e uomo, colore, schiariture, trattamenti e barba. Prenotazione online.",
  operator: "Giulia",
  address: {
    street: "Strada Adriatica 109",
    city: "Pesaro",
    postalCode: "61121", // DA CONFERMARE
    region: "PU",
    country: "IT",
  },
  /** Numero in formato internazionale senza +, es. 393331234567. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  phone: process.env.NEXT_PUBLIC_PHONE ?? "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
} as const;

/** Fasce orarie [inizio, fine] per giorno ISO (1 lunedì ... 7 domenica). */
export type OpeningHours = Partial<Record<"1" | "2" | "3" | "4" | "5" | "6" | "7", [string, string][]>>;

/**
 * Orari di default DA CONFERMARE, usati dal seed. Poi si modificano
 * dall'admin (tabella Settings). Le due fasce separano la pausa pranzo.
 */
export const defaultOpeningHours: OpeningHours = {
  "2": [["09:00", "12:30"], ["14:30", "19:00"]],
  "3": [["09:00", "12:30"], ["14:30", "19:00"]],
  "4": [["09:00", "12:30"], ["14:30", "19:00"]],
  "5": [["09:00", "12:30"], ["14:30", "19:00"]],
  "6": [["09:00", "18:00"]],
};

export const weekdays = [
  { iso: "1", label: "Lunedì", schema: "Monday" },
  { iso: "2", label: "Martedì", schema: "Tuesday" },
  { iso: "3", label: "Mercoledì", schema: "Wednesday" },
  { iso: "4", label: "Giovedì", schema: "Thursday" },
  { iso: "5", label: "Venerdì", schema: "Friday" },
  { iso: "6", label: "Sabato", schema: "Saturday" },
  { iso: "7", label: "Domenica", schema: "Sunday" },
] as const;

/** Valori di default della promo prima visita (usati dal seed). */
export const promo = {
  discountPercent: 20,
  /** Ultimo giorno valido (incluso), ora di Roma. */
  endDate: "2026-11-30",
};

export function whatsappLink(text?: string): string | null {
  if (!site.whatsapp) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${site.whatsapp}${q}`;
}
