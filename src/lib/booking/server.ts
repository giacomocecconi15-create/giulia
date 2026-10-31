import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { defaultOpeningHours, promo, type OpeningHours } from "../site";
import { addDays, romeLocalToUtc, romeYmd } from "../time";
import { bookingDurationMinutes, computeAvailability, isSlotAvailable, type Interval } from "./availability";
import { computeQuote } from "./discount";

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
  };
}

export class BookingError extends Error {
  constructor(
    public code: "no_services" | "invalid_services" | "slot_unavailable" | "terms_required",
    message?: string,
  ) {
    super(message ?? code);
  }
}

/** Servizi attivi richiesti, con durata (solo lato server). */
async function servicesFor(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) throw new BookingError("no_services");
  const services = await prisma.service.findMany({ where: { id: { in: unique }, active: true } });
  if (services.length !== unique.length) throw new BookingError("invalid_services");
  return services;
}

async function busyBetween(db: Prisma.TransactionClient, from: Date, to: Date): Promise<Interval[]> {
  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: { status: { in: [...OCCUPYING] }, start: { lt: to }, end: { gt: from } },
      select: { start: true, end: true },
    }),
    db.block.findMany({ where: { start: { lt: to }, end: { gt: from } }, select: { start: true, end: true } }),
  ]);
  return [...bookings, ...blocks];
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
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const [services, settings] = await Promise.all([servicesFor(input.serviceIds), loadSettings()]);
  const durationMin = bookingDurationMinutes(services.map((s) => s.durationMin), settings.slotMinutes);
  const end = new Date(input.start.getTime() + durationMin * 60_000);
  const day = romeYmd(input.start);

  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(4242)::text`;

      const busy = await busyBetween(tx, romeLocalToUtc(day, "00:00"), romeLocalToUtc(addDays(day, 1), "00:00"));
      const ok = isSlotAvailable(input.start, {
        durationMin,
        openingHours: settings.openingHours,
        slotMinutes: settings.slotMinutes,
        busy,
        now,
        minLeadMinutes: settings.minLeadMinutes,
        lastDay: addDays(romeYmd(now), settings.bookingHorizonDays),
      });
      if (!ok) throw new BookingError("slot_unavailable");

      const quote = computeQuote({
        items: services,
        isFirstVisit: await isFirstVisit(tx, input.customerId),
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
          items: { create: services.map((s) => ({ serviceId: s.id, priceCents: s.priceCents })) },
        },
        include: { items: { include: { service: { select: { name: true } } } } },
      });
    },
    { isolationLevel: "ReadCommitted", timeout: 10_000 },
  );
}
