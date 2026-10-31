import { handleError, json } from "@/lib/api";
import { onBookingCancelled } from "@/lib/booking/events";
import { cancelBooking } from "@/lib/booking/server";
import { getCurrentCustomer } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized" }, 401);
  try {
    const b = await cancelBooking((await params).id, customer.id);
    await onBookingCancelled(b);
    return json({ ok: true, lateCancellation: b.lateCancellation });
  } catch (e) {
    return handleError(e);
  }
}
