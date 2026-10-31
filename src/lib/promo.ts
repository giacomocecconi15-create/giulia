/**
 * True se la promo è attiva: l'ultimo giorno (endDate, solo data) è incluso
 * fino alle 23:59:59 ora di Roma.
 */
export function isPromoActive(endDate: Date, now: Date = new Date()): boolean {
  const ymd = endDate.toISOString().slice(0, 10);
  // Fine giornata a Roma: 23:59:59 locali. Uso l'offset effettivo di quel giorno.
  const endUtc = new Date(`${ymd}T23:59:59Z`);
  const offsetMin = romeOffsetMinutes(endUtc);
  return now.getTime() <= endUtc.getTime() - offsetMin * 60_000;
}

/** Scarto in minuti di Europe/Rome rispetto a UTC in un dato istante (60 o 120). */
export function romeOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - Math.floor(at.getTime() / 60_000) * 60_000) / 60_000);
}
