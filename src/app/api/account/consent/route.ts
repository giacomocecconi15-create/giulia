import { json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/session";

/** POST { marketing: boolean }: consenso a richiami e richieste di recensione */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized" }, 401);
  const { marketing } = (await req.json().catch(() => ({}))) as { marketing?: boolean };
  await prisma.customer.update({
    where: { id: customer.id },
    data: { marketingConsent: !!marketing, marketingConsentAt: new Date() },
  });
  return json({ ok: true, marketing: !!marketing });
}
