import "server-only";
import { prisma } from "../db";
import { site } from "../site";
import { addDays, romeLocalToUtc, romeYmd } from "../time";
import { sendTemplate, trySend } from "../whatsapp";
import { bookingDurationMinutes, computeAvailability } from "./availability";
import { BookingError, busyBetween, createBooking, loadSettings } from "./server";
import { when } from "./events";

export const HOLD_MINUTES = 15;

/** Iscrizione alla lista d'attesa per un giorno (una sola attiva per giorno). */
export async function joinWaitlist(customerId: string, date: string, serviceIds: string[]) {
  const [services, settings] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: serviceIds }, active: true } }),
    loadSettings(),
  ]);
  if (services.length === 0 || services.length !== new Set(serviceIds).size) throw new BookingError("invalid_services");
  const durationMin = bookingDurationMinutes(services.map((s) => s.durationMin), settings.slotMinutes);
  const day = new Date(`${date}T00:00:00Z`);
  const existing = await prisma.waitlistEntry.findFirst({
    where: { customerId, date: day, status: { in: ["waiting", "notified"] } },
  });
  if (existing) {
    return prisma.waitlistEntry.update({ where: { id: existing.id }, data: { serviceIds, durationMin } });
  }
  return prisma.waitlistEntry.create({ data: { customerId, date: day, serviceIds, durationMin } });
}

/**
 * Si è liberato [start, end): avvisa il primo in lista per quel giorno che ci
 * sta dentro e gli tiene lo slot per 15 minuti. Uno alla volta, in ordine di
 * iscrizione; allo scadere passa al successivo (advanceWaitlist).
 */
export async function offerFreedSlot(start: Date, end: Date, now = new Date()) {
  if (start <= now) return null;
  const date = romeYmd(start);
  const settings = await loadSettings();
  const dayStart = romeLocalToUtc(date, "00:00");
  const dayEnd = romeLocalToUtc(addDays(date, 1), "00:00");

  // C'è già qualcuno avvisato per questo intervallo? Allora aspetta il suo turno.
  const pending = await prisma.waitlistEntry.findFirst({
    where: { status: "notified", heldUntil: { gt: now }, heldStart: { lt: end }, heldEnd: { gt: start } },
  });
  if (pending) return null;

  const entries = await prisma.waitlistEntry.findMany({
    where: { date: new Date(`${date}T00:00:00Z`), status: "waiting" },
    orderBy: { createdAt: "asc" },
    include: { customer: true },
  });
  if (entries.length === 0) return null;
  const busy = await busyBetween(prisma, dayStart, dayEnd);

  for (const e of entries) {
    const [day] = computeAvailability({
      from: date,
      days: 1,
      durationMin: e.durationMin,
      openingHours: settings.openingHours,
      slotMinutes: settings.slotMinutes,
      busy,
      now,
      minLeadMinutes: settings.minLeadMinutes,
      lastDay: date,
    });
    // Uno slot che usa l'intervallo liberato
    const slot = day?.slots.find((s) => s.start < end && s.end > start);
    if (!slot) continue;

    const held = await prisma.waitlistEntry.update({
      where: { id: e.id },
      data: {
        status: "notified",
        notifiedAt: now,
        heldStart: slot.start,
        heldEnd: slot.end,
        heldUntil: new Date(now.getTime() + HOLD_MINUTES * 60_000),
      },
    });
    const w = when(slot.start);
    await trySend(
      () =>
        sendTemplate(e.customer.phone, "waitlist", [e.customer.name, w.day, w.time], [
          { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `WL:${e.id}` }] },
        ]),
      "lista d'attesa",
    );
    console.log(`[Lista d'attesa] ${site.url}/attesa/${e.id}`);
    return held;
  }
  return null;
}

/** Avvisi scaduti: libera lo slot e passa al successivo. Da chiamare periodicamente. */
export async function advanceWaitlist(now = new Date()) {
  const expired = await prisma.waitlistEntry.findMany({ where: { status: "notified", heldUntil: { lte: now } } });
  for (const e of expired) {
    await prisma.waitlistEntry.update({ where: { id: e.id }, data: { status: "expired" } });
    if (e.heldStart && e.heldEnd) await offerFreedSlot(e.heldStart, e.heldEnd, now);
  }
  // Iscrizioni per giorni passati
  await prisma.waitlistEntry.updateMany({
    where: { status: "waiting", date: { lt: new Date(`${romeYmd(now)}T00:00:00Z`) } },
    data: { status: "expired" },
  });
  return expired.length;
}

/** Il cliente avvisato prende lo slot tenuto da parte. */
export async function claimWaitlist(entryId: string, customerId: string, now = new Date()) {
  const e = await prisma.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!e || e.customerId !== customerId) throw new BookingError("not_found");
  if (e.status !== "notified" || !e.heldUntil || e.heldUntil <= now || !e.heldStart) throw new BookingError("too_late");
  const booking = await createBooking({
    customerId,
    serviceIds: e.serviceIds,
    start: e.heldStart,
    source: "lista_attesa",
    fromWaitlist: true,
    now,
  });
  await prisma.waitlistEntry.update({ where: { id: e.id }, data: { status: "booked" } });
  return booking;
}
