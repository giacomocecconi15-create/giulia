import { weekdays, type OpeningHours } from "./site";

export type RigaOrario = { iso: string; label: string; schema: string; slots: [string, string][] };

/** Giorni aperti in ordine da lunedì, con le loro fasce. */
export function giorniAperti(h: OpeningHours): RigaOrario[] {
  return weekdays
    .map((d) => ({ ...d, slots: h[d.iso] ?? [] }))
    .filter((d) => d.slots.length > 0);
}

/** "Domenica e lunedì", "Lunedì", "" */
export function giorniChiusi(h: OpeningHours): string {
  const chiusi = weekdays.filter((d) => !(h[d.iso]?.length)).map((d) => d.label.toLowerCase());
  // Domenica prima: è la formula più naturale ("domenica e lunedì")
  chiusi.sort((a, b) => (a === "domenica" ? -1 : b === "domenica" ? 1 : 0));
  if (chiusi.length === 0) return "";
  const testo = chiusi.length === 1 ? chiusi[0] : `${chiusi.slice(0, -1).join(", ")} e ${chiusi.at(-1)}`;
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

export function formatFasce(slots: [string, string][]): string {
  return slots.map(([a, b]) => `${a}-${b}`).join(", ");
}
