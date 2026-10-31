import { json } from "@/lib/api";
import { getCurrentCustomer } from "@/lib/session";
import { saveCardFromSetupIntent } from "@/lib/stripe";

/** POST { setupIntentId } */
export async function POST(req: Request) {
  const c = await getCurrentCustomer();
  if (!c) return json({ error: "unauthorized" }, 401);
  const { setupIntentId } = (await req.json().catch(() => ({}))) as { setupIntentId?: string };
  try {
    await saveCardFromSetupIntent(c, setupIntentId ?? "");
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "invalid", message: "Non siamo riusciti a salvare la carta. Riprova." }, 400);
  }
}
