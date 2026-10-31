import { romeOffsetMinutes } from "./promo";

/** "2026-11-03" + "09:30" ora di Roma -> istante UTC. */
export function romeLocalToUtc(ymd: string, hhmm: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const off1 = romeOffsetMinutes(new Date(guess));
  let utc = guess - off1 * 60_000;
  const off2 = romeOffsetMinutes(new Date(utc));
  if (off2 !== off1) utc = guess - off2 * 60_000;
  return new Date(utc);
}

const fmtYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHm = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Istante -> "2026-11-03" (giorno a Roma) */
export function romeYmd(d: Date): string {
  return fmtYmd.format(d);
}

/** Istante -> "09:30" (ora di Roma) */
export function romeHm(d: Date): string {
  return fmtHm.format(d);
}

/** Giorno ISO della settimana (1 lunedì ... 7 domenica) di una data "YYYY-MM-DD". */
export function isoWeekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** "2026-11-03" + n giorni */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const fmtGiorno = new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const fmtGiornoLungo = new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/** "2026-11-03" -> "mar 3 nov" */
export function labelGiorno(ymd: string): string {
  return fmtGiorno.format(new Date(`${ymd}T00:00:00Z`)).replace(/\./g, "");
}

/** "2026-11-03" -> "martedì 3 novembre" */
export function labelGiornoLungo(ymd: string): string {
  return fmtGiornoLungo.format(new Date(`${ymd}T00:00:00Z`));
}
