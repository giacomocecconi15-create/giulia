import { json } from "@/lib/api";
import { getCurrentCustomer } from "@/lib/session";
import { createSetupIntent, savedCardInfo, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** GET: carta salvata (se c'è). POST: nuovo SetupIntent per salvare una carta. */
export async function GET() {
  const c = await getCurrentCustomer();
  if (!c) return json({ error: "unauthorized" }, 401);
  if (!stripeConfigured()) return json({ enabled: false });
  return json({ enabled: true, card: await savedCardInfo(c.stripePaymentMethodId) });
}

export async function POST() {
  const c = await getCurrentCustomer();
  if (!c) return json({ error: "unauthorized" }, 401);
  if (!stripeConfigured()) return json({ enabled: false });
  try {
    const si = await createSetupIntent(c);
    return json({ enabled: true, clientSecret: si.client_secret });
  } catch (e) {
    console.error(e);
    return json({ error: "stripe_error", message: "Servizio carte non disponibile. Riprova tra poco." }, 502);
  }
}
