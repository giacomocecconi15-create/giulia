import type { OpeningHours } from "../site";
import { addDays, isoWeekday, romeHm, romeLocalToUtc, romeYmd } from "../time";

export type Interval = { start: Date; end: Date };

/**
 * Durata della prenotazione: somma delle durate arrotondata per eccesso
 * a blocchi di slotMinutes (§6 Disponibilità).
 */
export function bookingDurationMinutes(durations: number[], slotMinutes: number): number {
  const total = durations.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return Math.ceil(total / slotMinutes) * slotMinutes;
}

export type AvailabilityParams = {
  /** Primo giorno "YYYY-MM-DD" (ora di Roma) */
  from: string;
  days: number;
  durationMin: number;
  openingHours: OpeningHours;
  slotMinutes: number;
  /** Prenotazioni attive e blocchi (pause, ferie, appuntamenti al telefono) */
  busy: Interval[];
  now: Date;
  /** Preavviso minimo in minuti */
  minLeadMinutes: number;
  /** Ultimo giorno prenotabile "YYYY-MM-DD" (incluso) */
  lastDay: string;
};

export type Slot = { start: Date; end: Date; time: string };
export type DayAvailability = { date: string; slots: Slot[] };

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && a.end > b.start;
}

/**
 * Orari di inizio validi per ogni giorno. Uno slot è valido se tutti i blocchi
 * necessari sono liberi e stanno nella stessa fascia (la pausa pranzo non si
 * scavalca), se rispetta il preavviso minimo e se il giorno è nell'orizzonte.
 */
export function computeAvailability(p: AvailabilityParams): DayAvailability[] {
  const result: DayAvailability[] = [];
  if (p.durationMin <= 0) return result;
  const earliest = p.now.getTime() + p.minLeadMinutes * 60_000;

  for (let i = 0; i < p.days; i++) {
    const date = addDays(p.from, i);
    if (date > p.lastDay) break;
    const fasce = p.openingHours[String(isoWeekday(date)) as keyof OpeningHours] ?? [];
    const slots: Slot[] = [];

    for (const [open, close] of fasce) {
      const o = toMin(open);
      const c = toMin(close);
      for (let t = o; t + p.durationMin <= c; t += p.slotMinutes) {
        const start = romeLocalToUtc(date, toHm(t));
        const end = new Date(start.getTime() + p.durationMin * 60_000);
        if (start.getTime() < earliest) continue;
        if (p.busy.some((b) => overlaps({ start, end }, b))) continue;
        slots.push({ start, end, time: romeHm(start) });
      }
    }
    result.push({ date, slots });
  }
  return result;
}

/** True se l'inizio richiesto è uno degli slot validi di quel giorno. */
export function isSlotAvailable(start: Date, p: Omit<AvailabilityParams, "from" | "days">): boolean {
  const date = romeYmd(start);
  const [day] = computeAvailability({ ...p, from: date, days: 1 });
  return !!day?.slots.some((s) => s.start.getTime() === start.getTime());
}
