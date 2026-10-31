import { json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { normalizeItalianMobile } from "@/lib/phone";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const errors = {
  invalid: "Codice non corretto.",
  expired: "Codice scaduto. Richiedine uno nuovo.",
  too_many_attempts: "Troppi tentativi. Richiedi un nuovo codice.",
} as const;

/**
 * POST { phone, code, name? }
 * Numero nuovo senza nome: risponde needsName e il codice resta valido.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { phone?: string; code?: string; name?: string };
  const phone = normalizeItalianMobile(body.phone ?? "");
  const code = (body.code ?? "").replace(/\D/g, "");
  if (!phone || code.length !== 6) return json({ error: "invalid", message: errors.invalid }, 400);

  const name = (body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const existing = await prisma.customer.findUnique({ where: { phone } });
  const needsName = !existing && name.length < 2;

  const result = await verifyOtp(phone, code, !needsName);
  if (result !== "ok") return json({ error: result, message: errors[result] }, 400);
  if (needsName) return json({ needsName: true });

  const customer = existing ?? (await prisma.customer.create({ data: { phone, name } }));
  await createSession(customer.id);
  return json({ ok: true, customer: { name: customer.name, phone: customer.phone } });
}
