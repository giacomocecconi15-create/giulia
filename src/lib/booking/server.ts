import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { stripeConfigured } from "../stripe";
import { defaultOpeningHours, promo, type OpeningHours } from "../site";
import { addDays, romeLocalToUtc, romeYmd } from "../time";
import { bookingDurationMinutes, computeAvailability, isSlotAvailable, type Interval } from "./availability";
import { computeQuote } from "./discount";
import { ITEMS_ORDER } from "@/lib/booking/order";

/** Stati che occupano l'agenda. */
const OCCUPYING = ["confirmed", "completed", "no_show"] as const;

export async function loadSettings() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  return {
    openingHours: (s?.openingHours as OpeningHours | undefined) ?? defaultOpeningHours,
    slotMinutes: s?.slotMinutes ?? 30,
    bookingHorizonDays: s?.bookingHorizonDays ?? 60,
    minLeadMinutes: s?.minLeadMinutes ?? 60,
    discountPct: s?.firstVisitDiscountPct ?? promo.discountPercent,
    promoEndDate: s?.promoEndDate ?? new Date(`${promo.endDate}T00:00:00Z`),
    freeCancellationHours: s?.freeCancellationHours ?? 24,
    maxLateMinutes: s?.maxLateMinutes ?? 15,
    recallDays: s?.recallDays ?? 45,
  };
}

export class BookingError extends Error {
  constructor(
    public code:
      | "no_services"
      | "invalid_services"
      | "slot_unavailable"
      | "terms_required"
      | "not_found"
      | "too_late"
      | "card_required",
    message?: string,
  ) {
    super(message ?? code);
  }
}

/** Servizi attivi richiesti, con durata (solo lato server). */
async function servicesFor(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) throw new BookingError("no_services");
  const services = await prisma.service.findMany({
    where: { id: { in: unique }, active: true },
    orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  if (services.length !== unique.length) throw new BookingError("invalid_services");
  return services;
}

export async function busyBetween(
  db: Prisma.TransactionClient,
  from: Date,
  to: Date,
  opts: { excludeBookingId?: string; excludeHoldForCustomer?: string } = {},
): Promise<Interval[]> {
  const now = new Date();
  const [bookings, blocks, holds] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { in: [...OCCUPYING] },
        start: { lt: to },
        end: { gt: from },
        ...(opts.excludeBookingId && { id: { not: opts.excludeBookingId } }),
      },
      select: { start: true, end: true },
    }),
    db.block.findMany({ where: { start: { lt: to }, end: { gt: from } }, select: { start: true, end: true } }),
    // Slot tenuti da parte per chi è stato avvisato dalla lista d'attesa (15 minuti)
    db.waitlistEntry.findMany({
      where: {
        status: "notified",
        heldUntil: { gt: now },
        heldStart: { lt: to },
        heldEnd: { gt: from },
        ...(opts.excludeHoldForCustomer && { customerId: { not: opts.excludeHoldForCustomer } }),
      },
      select: { heldStart: true, heldEnd: true },
    }),
  ]);
  return [
    ...bookings,
    ...blocks,
    ...holds.map((h) => ({ start: h.heldStart!, end: h.heldEnd! })),
  ];
}

/** Disponibilità per i servizi scelti, a partire da un giorno. */
export async function getAvailability(serviceIds: string[], from: string, days: number, now = new Date()) {
  const [services, settings] = await Promise.all([servicesFor(serviceIds), loadSettings()]);
  const durationMin = bookingDurationMinutes(services.map((s) => s.durationMin), settings.slotMinutes);
  const today = romeYmd(now);
  const start = from < today ? today : from;
  const lastDay = addDays(today, settings.bookingHorizonDays);
  const rangeStart = romeLocalToUtc(start, "00:00");
  const rangeEnd = romeLocalToUtc(addDays(start, days), "00:00");
  const busy = await busyBetween(prisma, rangeStart, rangeEnd);
  const result = computeAvailability({
    from: start,
    days,
    durationMin,
    openingHours: settings.openingHours,
    slotMinutes: settings.slotMinutes,
    busy,
    now,
    minLeadMinutes: settings.minLeadMinutes,
    lastDay,
  });
  return { days: result, lastDay, today };
}

/** Prima visita: nessuna visita completata e nessuna altra prenotazione scontata attiva. */
async function isFirstVisit(db: Prisma.TransactionClient, customerId: string) {
  const previous = await db.booking.count({
    where: {
      customerId,
      OR: [{ status: "completed" }, { status: "confirmed", discountCents: { gt: 0 } }],
    },
  });
  return previous === 0;
}

/** Riepilogo prezzi; senza cliente lo sconto è quello che avrebbe un nuovo cliente. */
export async function getQuote(serviceIds: string[], customerId: string | null, now = new Date()) {
  const [services, settings] = await Promise.all([servicesFor(serviceIds), loadSettings()]);
  const firstVisit = customerId ? await isFirstVisit(prisma, customerId) : true;
  const quote = computeQuote({
    items: services,
    isFirstVisit: firstVisit,
    createdAt: now,
    promoEndDate: settings.promoEndDate,
    discountPct: settings.discountPct,
  });
  return {
    ...quote,
    discountPct: settings.discountPct,
    items: services.map((s) => ({ id: s.id, name: s.name, priceCents: s.priceCents, priceFrom: s.priceFrom })),
  };
}

/**
 * Crea la prenotazione. Il lock advisory serializza le conferme: due clienti
 * che premono insieme sullo stesso orario non possono entrambi riuscire.
 */
export async function createBooking(input: {
  customerId: string;
  serviceIds: string[];
  start: Date;
  source?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  fromWaitlist?: boolean;
  /** Prenotazione inserita da Giulia (telefono): niente carta, niente preavviso */
  byAdmin?: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (!input.byAdmin && stripeConfigured()) {
    const c = await prisma.customer.findUnique({ where: { id: input.customerId }, select: { stripePaymentMethodId: true } });
    if (!c?.stripePaymentMethodId) throw new BookingError("card_required");
  }
  const [services, settings] = await Promise.all([servicesFor(input.serviceIds), loadSettings()]);
  const durationMin = bookingDurationMinutes(services.map((s) => s.durationMin), settings.slotMinutes);
  const end = new Date(input.start.getTime() + durationMin * 60_000);
  const day = romeYmd(input.start);

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(4242)::text`;

      const busy = await busyBetween(tx, romeLocalToUtc(day, "00:00"), romeLocalToUtc(addDays(day, 1), "00:00"), {
        excludeHoldForCustomer: input.customerId,
      });
      const ok = isSlotAvailable(input.start, {
        durationMin,
        openingHours: settings.openingHours,
        slotMinutes: settings.slotMinutes,
        busy,
        now,
        minLeadMinutes: input.byAdmin ? 0 : settings.minLeadMinutes,
        lastDay: input.byAdmin ? "9999-12-31" : addDays(romeYmd(now), settings.bookingHorizonDays),
      });
      if (!ok) throw new BookingError("slot_unavailable");

      const quote = computeQuote({
        items: services,
        // Lo sconto prima visita vale per le prenotazioni online (Termini, § Promozione)
        isFirstVisit: input.byAdmin ? false : await isFirstVisit(tx, input.customerId),
        createdAt: now,
        promoEndDate: settings.promoEndDate,
        discountPct: settings.discountPct,
      });

      return tx.booking.create({
        data: {
          customerId: input.customerId,
          start: input.start,
          end,
          totalPriceCents: quote.totalCents,
          discountCents: quote.discountCents,
          source: input.source ?? "online",
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
          fromWaitlist: input.fromWaitlist ?? false,
          createdByAdmin: input.byAdmin ?? false,
          items: { create: services.map((s) => ({ serviceId: s.id, priceCents: s.priceCents })) },
        },
        include: { customer: true, items: { orderBy: ITEMS_ORDER, include: { service: { select: { name: true } } } } },
      });
    },
    { isolationLevel: "ReadCommitted", timeout: 10_000 },
  );
}

/** Prenotazione del cliente, solo se sua. */
async function ownBooking(bookingId: string, customerId: string) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, include: { items: true } });
  if (!b || b.customerId !== customerId) throw new BookingError("not_found");
  return b;
}

/**
 * Disdetta dal cliente. Sempre possibile prima dell'inizio; nelle ultime
 * freeCancellationHours viene segnata come tardiva (possibile addebito).
 */
export async function cancelBooking(bookingId: string, customerId: string, now = new Date()) {
  const b = await ownBooking(bookingId, customerId);
  if (b.status !== "confirmed" || b.start <= now) throw new BookingError("too_late");
  const settings = await loadSettings();
  const late = b.start.getTime() - now.getTime() < settings.freeCancellationHours * 3_600_000;
  return prisma.booking.update({
    where: { id: b.id },
    data: { status: "cancelled", cancelledAt: now, lateCancellation: late },
    include: { customer: true, items: { orderBy: ITEMS_ORDER, include: { service: true } } },
  });
}

/** Sposta una prenotazione: online solo prima della finestra di disdetta gratuita. */
export async function rescheduleBooking(bookingId: string, customerId: string, newStart: Date, now = new Date()) {
  const b = await ownBooking(bookingId, customerId);
  const settings = await loadSettings();
  if (b.status !== "confirmed" || b.start.getTime() - now.getTime() < settings.freeCancellationHours * 3_600_000) {
    throw new BookingError("too_late");
  }
  const services = await prisma.service.findMany({ where: { id: { in: b.items.map((i) => i.serviceId) } } });
  const durationMin = bookingDurationMinutes(services.map((s) => s.durationMin), settings.slotMinutes);
  const day = romeYmd(newStart);
  const previous = { start: b.start, end: b.end };

  const updated = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(4242)::text`;
      const busy = await busyBetween(tx, romeLocalToUtc(day, "00:00"), romeLocalToUtc(addDays(day, 1), "00:00"), {
        excludeBookingId: b.id,
        excludeHoldForCustomer: customerId,
      });
      const ok = isSlotAvailable(newStart, {
        durationMin,
        openingHours: settings.openingHours,
        slotMinutes: settings.slotMinutes,
        busy,
        now,
        minLeadMinutes: settings.minLeadMinutes,
        lastDay: addDays(romeYmd(now), settings.bookingHorizonDays),
      });
      if (!ok) throw new BookingError("slot_unavailable");
      return tx.booking.update({
        where: { id: b.id },
        data: { start: newStart, end: new Date(newStart.getTime() + durationMin * 60_000), reminderSentAt: null, customerConfirmedAt: null },
        include: { customer: true, items: { orderBy: ITEMS_ORDER, include: { service: true } } },
      });
    },
    { isolationLevel: "ReadCommitted", timeout: 10_000 },
  );
  return { updated, previous };
}
