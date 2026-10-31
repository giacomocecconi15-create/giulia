import { handleError, json } from "@/lib/api";
import { onBookingCreated } from "@/lib/booking/events";
import { claimWaitlist } from "@/lib/booking/waitlist";
import { getCurrentCustomer } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized" }, 401);
  try {
    const b = await claimWaitlist((await params).id, customer.id);
    await onBookingCreated(b);
    return json({ ok: true, id: b.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
