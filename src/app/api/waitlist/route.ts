import { handleError, json, parseServiceIds } from "@/lib/api";
import { joinWaitlist } from "@/lib/booking/waitlist";
import { getCurrentCustomer } from "@/lib/session";

/** POST { date, serviceIds }: iscrizione alla lista d'attesa */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized", message: "Accedi per iscriverti." }, 401);
  try {
    const body = (await req.json().catch(() => ({}))) as { date?: string; serviceIds?: string[] };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "")) return json({ error: "invalid_date" }, 400);
    await joinWaitlist(customer.id, body.date!, parseServiceIds((body.serviceIds ?? []).join(",")));
    return json({ ok: true }, 201);
  } catch (e) {
    return handleError(e);
  }
}
