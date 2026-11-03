import { json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { parseProfile } from "@/lib/profile";
import { getCurrentCustomer } from "@/lib/session";

/** POST { bio, ageRange, hairType }: profilo facoltativo del cliente */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: "unauthorized", message: "Sessione scaduta: accedi di nuovo." }, 401);
  const data = parseProfile((await req.json().catch(() => ({}))) as Record<string, unknown>);
  await prisma.customer.update({ where: { id: customer.id }, data: { ...data, profileUpdatedAt: new Date() } });
  return json({ ok: true, ...data });
}
