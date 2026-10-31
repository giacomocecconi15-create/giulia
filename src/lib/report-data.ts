import "server-only";
import { prisma } from "./db";
import type { ReportBooking } from "./report";

/** Tutte le prenotazioni in forma compatta per il report. */
export async function loadReportBookings(): Promise<ReportBooking[]> {
  const rows = await prisma.booking.findMany({
    include: { customer: { select: { name: true } }, items: { include: { service: { select: { name: true } } } } },
    orderBy: { start: "asc" },
  });
  return rows.map((b) => ({
    id: b.id,
    customerId: b.customerId,
    customerName: b.customer.name,
    start: b.start,
    status: b.status,
    source: b.source,
    utmCampaign: b.utmCampaign,
    createdByAdmin: b.createdByAdmin,
    fromWaitlist: b.fromWaitlist,
    lateCancellation: b.lateCancellation,
    finalCents: b.totalPriceCents - b.discountCents,
    services: b.items.map((i) => i.service.name),
  }));
}
