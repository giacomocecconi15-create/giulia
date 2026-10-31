import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getCurrentCustomer } from "./session";
import { loadSettings } from "./booking/server";
import { addDays, isoWeekday, romeHm, romeLocalToUtc } from "./time";
import type { OpeningHours } from "./site";

export async function requireAdmin() {
  const c = await getCurrentCustomer();
  if (!c || c.role !== "admin") redirect("/account");
  return c;
}

/** Variante per le server action: lancia invece di reindirizzare. */
export async function assertAdmin() {
  const c = await getCurrentCustomer();
  if (!c || c.role !== "admin") throw new Error("Non autorizzato");
  return c;
}

const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
const toHm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type AgendaItem =
  | { kind: "booking"; id: string; start: Date; end: Date; time: string; endTime: string; name: string; phone: string; services: string; status: string; confirmedByCustomer: boolean; priceCents: number; createdByAdmin: boolean; fromWaitlist: boolean }
  | { kind: "block"; id: string; start: Date; end: Date; time: string; endTime: string; reason: string }
  | { kind: "free"; start: Date; end: Date; time: string }
  | { kind: "break"; time: string; endTime: string };

/** Agenda di un giorno: prenotazioni, blocchi, slot liberi e pausa pranzo. */
export async function getDayAgenda(date: string) {
  const settings = await loadSettings();
  const fasce = (settings.openingHours as OpeningHours)[String(isoWeekday(date)) as keyof OpeningHours] ?? [];
  const dayStart = romeLocalToUtc(date, "00:00");
  const dayEnd = romeLocalToUtc(addDays(date, 1), "00:00");

  const [bookings, blocks, cancelled] = await Promise.all([
    prisma.booking.findMany({
      where: { start: { gte: dayStart, lt: dayEnd }, status: { in: ["confirmed", "completed", "no_show"] } },
      include: { customer: true, items: { include: { service: true } } },
      orderBy: { start: "asc" },
    }),
    prisma.block.findMany({ where: { start: { lt: dayEnd }, end: { gt: dayStart } }, orderBy: { start: "asc" } }),
    prisma.booking.findMany({
      where: { start: { gte: dayStart, lt: dayEnd }, status: "cancelled" },
      include: { customer: true, items: { include: { service: true } } },
      orderBy: { start: "asc" },
    }),
  ]);

  const items: AgendaItem[] = [
    ...bookings.map((b) => ({
      kind: "booking" as const,
      id: b.id,
      start: b.start,
      end: b.end,
      time: romeHm(b.start),
      endTime: romeHm(b.end),
      name: b.customer.name,
      phone: b.customer.phone,
      services: b.items.map((i) => i.service.name).join(", "),
      status: b.status,
      confirmedByCustomer: !!b.customerConfirmedAt,
      priceCents: b.totalPriceCents - b.discountCents,
      createdByAdmin: b.createdByAdmin,
      fromWaitlist: b.fromWaitlist,
    })),
    ...blocks.map((k) => ({
      kind: "block" as const,
      id: k.id,
      start: k.start,
      end: k.end,
      time: k.start < dayStart ? "00:00" : romeHm(k.start),
      endTime: k.end > dayEnd ? "24:00" : romeHm(k.end),
      reason: k.reason,
    })),
  ];

  // Slot liberi dentro le fasce
  const occupied = items.filter((i) => i.kind === "booking" || i.kind === "block") as { start: Date; end: Date }[];
  for (const [i, [open, close]] of fasce.entries()) {
    for (let t = toMin(open); t + settings.slotMinutes <= toMin(close); t += settings.slotMinutes) {
      const start = romeLocalToUtc(date, toHm(t));
      const end = new Date(start.getTime() + settings.slotMinutes * 60_000);
      if (!occupied.some((o) => o.start < end && o.end > start)) items.push({ kind: "free", start, end, time: toHm(t) });
    }
    const next = fasce[i + 1];
    if (next) items.push({ kind: "break", time: close, endTime: next[0] });
  }

  const order = (x: AgendaItem) => x.time;
  items.sort((a, b) => (order(a) < order(b) ? -1 : order(a) > order(b) ? 1 : 0));
  return { fasce, items, cancelled, slotMinutes: settings.slotMinutes };
}

export async function getWeekSummary(monday: string) {
  const start = romeLocalToUtc(monday, "00:00");
  const end = romeLocalToUtc(addDays(monday, 7), "00:00");
  const bookings = await prisma.booking.findMany({
    where: { start: { gte: start, lt: end }, status: { in: ["confirmed", "completed", "no_show"] } },
    include: { customer: true, items: { include: { service: true } } },
    orderBy: { start: "asc" },
  });
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const ds = romeLocalToUtc(date, "00:00");
    const de = romeLocalToUtc(addDays(date, 1), "00:00");
    return { date, bookings: bookings.filter((b) => b.start >= ds && b.start < de) };
  });
}
