/**
 * Dati dell'attività. Quelli marcati DA CONFERMARE vanno verificati
 * con Giulia prima del lancio (docs/HANDOFF.md §9).
 */
export const site = {
  name: "Level Up Hair Salon & Barber Shop",
  shortName: "Level Up",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
  /**
   * Orari DA CONFERMARE. Due fasce per giorno: la pausa pranzo
   * separa le fasce e il calcolo disponibilità le rispetta.
   */
  hours: [
    { day: "Martedì", schema: "Tuesday", slots: [["09:00", "12:30"], ["14:30", "19:00"]] },
    { day: "Mercoledì", schema: "Wednesday", slots: [["09:00", "12:30"], ["14:30", "19:00"]] },
    { day: "Giovedì", schema: "Thursday", slots: [["09:00", "12:30"], ["14:30", "19:00"]] },
    { day: "Venerdì", schema: "Friday", slots: [["09:00", "12:30"], ["14:30", "19:00"]] },
    { day: "Sabato", schema: "Saturday", slots: [["09:00", "18:00"]] },
  ] as { day: string; schema: string; slots: [string, string][] }[],
  closedDays: "Domenica e lunedì",
} as const;

export const promo = {
  discountPercent: 20,
  /** Ultimo giorno valido (incluso), ora di Roma. */
  endDate: "2026-11-30",
  endLabel: "30 novembre 2026",
};

/** True se la promo prima visita è ancora attiva alla data indicata. */
export function isPromoActive(now: Date = new Date()): boolean {
  const end = new Date(`${promo.endDate}T23:59:59+01:00`);
  return now.getTime() <= end.getTime();
}

export function whatsappLink(text?: string): string | null {
  if (!site.whatsapp) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${site.whatsapp}${q}`;
}
