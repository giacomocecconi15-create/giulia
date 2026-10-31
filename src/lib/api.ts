import { NextResponse } from "next/server";
import { BookingError } from "./booking/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function parseServiceIds(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,64}$/.test(s))
    .slice(0, 20);
}

export function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || null;
}

const messages: Record<BookingError["code"], string> = {
  no_services: "Scegli almeno un servizio.",
  invalid_services: "Uno dei servizi scelti non è più disponibile.",
  slot_unavailable: "Questo orario non è più disponibile. Scegline un altro.",
  terms_required: "Per confermare devi accettare i Termini.",
  not_found: "Prenotazione non trovata.",
  too_late: "Non è più possibile modificare online questa prenotazione. Scrivici su WhatsApp.",
  card_required: "Per confermare serve una carta a garanzia.",
};

export function handleError(e: unknown) {
  if (e instanceof BookingError) return json({ error: e.code, message: messages[e.code] }, e.code === "slot_unavailable" ? 409 : e.code === "not_found" ? 404 : 400);
  console.error(e);
  return json({ error: "server_error", message: "Qualcosa non ha funzionato. Riprova tra poco." }, 500);
}
