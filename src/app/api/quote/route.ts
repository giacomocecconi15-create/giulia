import { handleError, json, parseServiceIds } from "@/lib/api";
import { getQuote } from "@/lib/booking/server";
import { getCurrentCustomer } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/quote?services=a,b : riepilogo prezzi con lo sconto reale del cliente */
export async function GET(req: Request) {
  try {
    const customer = await getCurrentCustomer();
    const quote = await getQuote(parseServiceIds(new URL(req.url).searchParams.get("services")), customer?.id ?? null);
    return json({ ...quote, personalized: !!customer });
  } catch (e) {
    return handleError(e);
  }
}
