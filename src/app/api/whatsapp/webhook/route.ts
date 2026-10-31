import { createHmac, timingSafeEqual } from "node:crypto";
import { handleInbound } from "@/lib/whatsapp-inbound";

export const dynamic = "force-dynamic";

/** Verifica del webhook da parte di Meta. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // in produzione la firma è obbligatoria
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Msg = {
  from: string;
  type: string;
  text?: { body: string };
  button?: { payload?: string; text?: string };
  interactive?: { button_reply?: { id: string } };
};

/** Messaggi in arrivo: risposte rapide dei template e testo libero. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("invalid signature", { status: 401 });

  const body = JSON.parse(raw) as { entry?: { changes?: { value?: { messages?: Msg[] } }[] }[] };
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        const payload = m.button?.payload ?? m.interactive?.button_reply?.id ?? null;
        const text = m.text?.body ?? m.button?.text ?? null;
        try {
          await handleInbound(m.from, payload, payload ? null : text);
        } catch (e) {
          console.error("[WhatsApp webhook]", e);
        }
      }
    }
  }
  // Meta vuole sempre 200, altrimenti ripete l'invio
  return new Response("ok", { status: 200 });
}
