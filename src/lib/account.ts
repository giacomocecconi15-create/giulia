import "server-only";
import { prisma } from "./db";
import { loadSettings } from "./booking/server";

export async function getAccountData(customerId: string, now = new Date()) {
  const [upcoming, past, card, settings, waitlist] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId, status: "confirmed", start: { gt: now } },
      orderBy: { start: "asc" },
      include: { items: { include: { service: { select: { name: true, active: true } } } } },
    }),
    prisma.booking.findMany({
      where: { customerId, OR: [{ start: { lte: now } }, { status: { not: "confirmed" } }] },
      orderBy: { start: "desc" },
      take: 20,
      include: { items: { include: { service: { select: { name: true, active: true } } } } },
    }),
    prisma.punchCard.findUnique({ where: { customerId } }),
    loadSettings(),
    prisma.waitlistEntry.findMany({
      where: { customerId, status: { in: ["waiting", "notified"] } },
      orderBy: { date: "asc" },
    }),
  ]);
  return { upcoming, past, card, settings, waitlist };
}
