import "server-only";
import { advanceWaitlist } from "./booking/waitlist";
import { refreshInstagramToken } from "./instagram";
import { loadSettings } from "./booking/server";
import { when } from "./booking/events";
import { prisma } from "./db";
import { site } from "./site";
import { romeHm } from "./time";
import { sendTemplate, trySend } from "./whatsapp";

const quickReplies = (bookingId: string) =>
  ["CONFIRM", "MOVE", "CANCEL"].map((p, i) => ({
    type: "button",
    sub_type: "quick_reply",
    index: String(i),
    parameters: [{ type: "payload", payload: `${p}:${bookingId}` }],
  }));

/** Promemoria per gli appuntamenti delle prossime 24 ore non ancora avvisati. */
export async function sendReminders(now = new Date()) {
  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      reminderSentAt: null,
      start: { gt: new Date(now.getTime() + 2 * 3_600_000), lte: new Date(now.getTime() + 24 * 3_600_000) },
      // Chi ha prenotato da meno di 2 ore ha appena ricevuto la conferma
      createdAt: { lt: new Date(now.getTime() - 2 * 3_600_000) },
    },
    include: { customer: true },
  });
  for (const b of bookings) {
    const w = when(b.start);
    await trySend(() => sendTemplate(b.customer.phone, "reminder", [b.customer.name, w.day, w.time], quickReplies(b.id)), "promemoria");
    await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: now } });
  }
  return bookings.length;
}

/** Richiamo dei clienti che non vengono da recallDays giorni (solo con consenso). */
export async function sendRecalls(now = new Date()) {
  const { recallDays } = await loadSettings();
  const cutoff = new Date(now.getTime() - recallDays * 86_400_000);
  const customers = await prisma.customer.findMany({
    where: {
      marketingConsent: true,
      role: "customer",
      bookings: { some: { status: "completed" }, none: { status: "confirmed", start: { gt: now } } },
    },
    include: { bookings: { where: { status: "completed" }, orderBy: { start: "desc" }, take: 1 } },
  });
  let sent = 0;
  for (const c of customers) {
    const last = c.bookings[0]?.start;
    if (!last || last > cutoff) continue;
    if (c.lastRecallAt && c.lastRecallAt > last) continue; // già richiamato dopo l'ultima visita
    const link = `${site.url}/prenota?utm_source=whatsapp&utm_medium=richiamo`;
    await trySend(() => sendTemplate(c.phone, "recall", [c.name, link]), "richiamo");
    await prisma.customer.update({ where: { id: c.id }, data: { lastRecallAt: now } });
    sent++;
  }
  return sent;
}

/** Richiesta di recensione Google dopo le visite completate (solo con consenso). */
export async function sendReviewRequests(now = new Date()) {
  const url = process.env.GOOGLE_REVIEW_URL;
  if (!url) return 0;
  const bookings = await prisma.booking.findMany({
    where: {
      status: "completed",
      reviewRequestedAt: null,
      start: { gt: new Date(now.getTime() - 3 * 86_400_000), lt: now },
      customer: { marketingConsent: true },
    },
    include: { customer: true },
  });
  // Una sola richiesta per cliente nella vita: chi l'ha già ricevuta non la riceve di nuovo
  for (const b of bookings) {
    const already = await prisma.booking.count({ where: { customerId: b.customerId, reviewRequestedAt: { not: null } } });
    if (already === 0) await trySend(() => sendTemplate(b.customer.phone, "review", [b.customer.name, url]), "recensione");
    await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestedAt: now } });
  }
  return bookings.length;
}

/**
 * Compiti periodici. Da chiamare ogni 5-60 minuti; i compiti giornalieri
 * partono una volta al giorno dopo le 18 (ora di Roma).
 */
export async function runTick(now = new Date()) {
  const result: Record<string, number | string> = {};
  result.waitlistExpired = await advanceWaitlist(now);
  result.reminders = await sendReminders(now);

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const todayRome = now.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
  const lastRome = settings?.lastDailyRunAt?.toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
  const afterSix = romeHm(now) >= "18:00";
  if (settings && afterSix && lastRome !== todayRome) {
    await prisma.settings.update({ where: { id: 1 }, data: { lastDailyRunAt: now } });
    result.recalls = await sendRecalls(now);
    result.reviews = await sendReviewRequests(now);
    result.instagram = await refreshInstagramToken(now).catch((e) => `errore ${e}`);
  } else {
    result.daily = "non ancora";
  }
  return result;
}
