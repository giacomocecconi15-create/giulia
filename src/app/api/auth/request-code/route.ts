import { clientIp, json } from "@/lib/api";
import { requestOtp } from "@/lib/otp";
import { normalizeItalianMobile } from "@/lib/phone";

export const dynamic = "force-dynamic";

/** POST { phone } : invia il codice di accesso su WhatsApp */
export async function POST(req: Request) {
  const { phone: raw } = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = normalizeItalianMobile(raw ?? "");
  if (!phone) return json({ error: "invalid_phone", message: "Inserisci un numero di cellulare italiano valido." }, 400);

  try {
    const r = await requestOtp(phone, clientIp(req));
    if (!r.ok) return json({ error: "rate_limited", message: "Troppe richieste. Riprova tra qualche minuto." }, 429);
    return json({ ok: true, phone, ...(r.devCode && { devCode: r.devCode }) });
  } catch (e) {
    console.error(e);
    return json({ error: "send_failed", message: "Non siamo riusciti a inviare il codice. Riprova." }, 502);
  }
}
