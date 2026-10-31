import { handleError, json, parseServiceIds } from "@/lib/api";
import { onBookingCreated } from "@/lib/booking/events";
import { BookingError, createBooking } from "@/lib/booking/server";
import { getCurrentCustomer } from "@/lib/session";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";

export const dynamic = "force-dynamic";

/** POST /api/bookings { serviceIds, start, acceptTerms } */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized", message: "Accedi per confermare." }, 401);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      serviceIds?: string[];
      start?: string;
      acceptTerms?: boolean;
      utm?: { source?: string; medium?: string; campaign?: string } | null;
    };
    const clean = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 80) || null : null);
    if (body.acceptTerms !== true) throw new BookingError("terms_required");
    const start = new Date(body.start ?? "");
    if (Number.isNaN(start.getTime())) throw new BookingError("slot_unavailable");

    const booking = await createBooking({
      customerId: customer.id,
      serviceIds: parseServiceIds((body.serviceIds ?? []).join(",")),
      start,
      source: clean(body.utm?.source) ?? "online",
      utmMedium: clean(body.utm?.medium),
      utmCampaign: clean(body.utm?.campaign),
    });
    await onBookingCreated(booking);
    return json(
      {
        id: booking.id,
        date: labelGiornoLungo(romeYmd(booking.start)),
        time: romeHm(booking.start),
        services: booking.items.map((i) => i.service.name),
        totalCents: booking.totalPriceCents,
        discountCents: booking.discountCents,
        finalCents: booking.totalPriceCents - booking.discountCents,
      },
      201,
    );
  } catch (e) {
    return handleError(e);
  }
}
