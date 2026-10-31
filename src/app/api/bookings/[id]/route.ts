import { handleError, json } from "@/lib/api";
import { onBookingRescheduled } from "@/lib/booking/events";
import { BookingError, rescheduleBooking } from "@/lib/booking/server";
import { getCurrentCustomer } from "@/lib/session";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

/** PATCH { start }: sposta la prenotazione */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized" }, 401);
  try {
    const { start } = (await req.json().catch(() => ({}))) as { start?: string };
    const d = new Date(start ?? "");
    if (Number.isNaN(d.getTime())) throw new BookingError("slot_unavailable");
    const { updated, previous } = await rescheduleBooking((await params).id, customer.id, d);
    await onBookingRescheduled(updated, previous);
    return json({
      id: updated.id,
      date: labelGiornoLungo(romeYmd(updated.start)),
      time: romeHm(updated.start),
      services: updated.items.map((i) => i.service.name),
      totalCents: updated.totalPriceCents,
      discountCents: updated.discountCents,
      finalCents: updated.totalPriceCents - updated.discountCents,
    });
  } catch (e) {
    return handleError(e);
  }
}
