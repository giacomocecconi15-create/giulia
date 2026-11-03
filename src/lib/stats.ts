import "server-only";
import { sourceLabel } from "./attribution";
import { prisma } from "./db";
import { ageRanges, hairTypes } from "./profile";
import { romeYmd } from "./time";

export type Bar = { label: string; value: number; detail?: string };

const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`)).replace(".", "");

/** Ultimi n mesi (YYYY-MM), dal più vecchio. */
function lastMonths(n: number, now: Date): string[] {
  const [y, m] = romeYmd(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

/** Statistiche per la dashboard dell'admin nel periodo indicato (giorni). */
export async function getStats(days: number, now = new Date()) {
  const from = new Date(now.getTime() - days * 86_400_000);
  const months = lastMonths(6, now);
  const monthsFrom = new Date(`${months[0]}-01T00:00:00Z`);

  const [items, services, bookings, customers, customersPeriod, clicks, clicksMonths] = await Promise.all([
    prisma.bookingItem.groupBy({
      by: ["serviceId"],
      where: { booking: { createdAt: { gte: from, lte: now }, status: { not: "cancelled" } } },
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.service.findMany({ select: { id: true, name: true } }),
    prisma.booking.findMany({
      // Prenotazioni ricevute nel periodo (anche per appuntamenti futuri)
      where: { createdAt: { gte: from, lte: now } },
      select: { status: true, lateCancellation: true, createdByAdmin: true, source: true, fromWaitlist: true },
    }),
    prisma.customer.findMany({ where: { role: "customer" }, select: { createdAt: true, hairType: true, ageRange: true } }),
    prisma.customer.count({ where: { role: "customer", createdAt: { gte: from } } }),
    prisma.event.groupBy({ by: ["ref"], where: { type: "instagram_click", createdAt: { gte: from } }, _count: { _all: true } }),
    prisma.event.findMany({ where: { type: "instagram_click", createdAt: { gte: monthsFrom } }, select: { createdAt: true } }),
  ]);

  const nameOf = Object.fromEntries(services.map((s) => [s.id, s.name]));
  const perServizio: Bar[] = items
    .map((i) => ({
      label: nameOf[i.serviceId] ?? i.serviceId,
      value: i._count._all,
      detail: `${new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((i._sum.priceCents ?? 0) / 100)} di listino`,
    }))
    .sort((a, b) => b.value - a.value);

  const valide = bookings.filter((b) => b.status !== "cancelled");
  const online = valide.filter((b) => !b.createdByAdmin).length;
  const fonti = new Map<string, number>();
  for (const b of valide) {
    const f = b.createdByAdmin ? "Telefono" : sourceLabel(b.source);
    fonti.set(f, (fonti.get(f) ?? 0) + 1);
  }

  const profiliMese = months.map((m) => ({
    label: monthLabel(m),
    value: customers.filter((c) => romeYmd(c.createdAt).startsWith(m)).length,
  }));
  const clickMese = months.map((m) => ({
    label: monthLabel(m),
    value: clicksMonths.filter((c) => romeYmd(c.createdAt).startsWith(m)).length,
  }));

  const conProfilo = customers.filter((c) => c.hairType || c.ageRange).length;
  const capelli: Bar[] = [
    ...hairTypes.map((h) => ({ label: h.label, value: customers.filter((c) => c.hairType === h.id).length })),
    { label: "Non indicato", value: customers.filter((c) => !c.hairType).length },
  ];
  const eta: Bar[] = [
    ...ageRanges.map((a) => ({ label: a.label, value: customers.filter((c) => c.ageRange === a.id).length })),
    { label: "Non indicata", value: customers.filter((c) => !c.ageRange).length },
  ];

  return {
    days,
    kpi: {
      prenotazioni: valide.length,
      online,
      percOnline: valide.length ? Math.round((online / valide.length) * 100) : null,
      disdette: bookings.filter((b) => b.status === "cancelled").length,
      tardiveNoShow: bookings.filter((b) => b.status === "no_show" || (b.status === "cancelled" && b.lateCancellation)).length,
      recuperati: valide.filter((b) => b.fromWaitlist).length,
      nuoviProfili: customersPeriod,
      clienti: customers.length,
      conProfilo,
      clickInstagram: clicks.reduce((a, c) => a + c._count._all, 0),
      clickPost: clicks.find((c) => c.ref === "post")?._count._all ?? 0,
      clickProfilo: clicks.find((c) => c.ref === "profilo")?._count._all ?? 0,
    },
    perServizio,
    fonti: [...fonti].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    profiliMese,
    clickMese,
    capelli,
    eta,
  };
}
