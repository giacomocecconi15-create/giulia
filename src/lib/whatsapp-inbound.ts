import "server-only";
import { onBookingCancelled } from "./booking/events";
import { BookingError, cancelBooking } from "./booking/server";
import { claimWaitlist } from "./booking/waitlist";
import { onBookingCreated } from "./booking/events";
import { prisma } from "./db";
import { site } from "./site";
import { sendText, trySend } from "./whatsapp";

/** Gestisce una risposta del cliente: pulsanti dei template o testo libero. */
export async function handleInbound(fromWaId: string, payload: string | null, text: string | null) {
  const phone = `+${fromWaId.replace(/\D/g, "")}`;
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) return;
  const reply = (body: string) => trySend(() => sendText(phone, body), "risposta");

  let action = payload ?? "";
  // Testo libero "Prendo" / "Confermo" / "Disdico": usa l'ultimo avviso o promemoria
  if (!action && text) {
    const t = text.trim().toLowerCase();
    if (t.startsWith("prendo")) {
      const e = await prisma.waitlistEntry.findFirst({ where: { customerId: customer.id, status: "notified" }, orderBy: { notifiedAt: "desc" } });
      if (e) action = `WL:${e.id}`;
    } else if (/^(confermo|disdico|disdici|sposta)/.test(t)) {
      const b = await prisma.booking.findFirst({
        where: { customerId: customer.id, status: "confirmed", start: { gt: new Date() } },
        orderBy: { start: "asc" },
      });
      if (b) action = `${t.startsWith("confermo") ? "CONFIRM" : t.startsWith("sposta") ? "MOVE" : "CANCEL"}:${b.id}`;
    }
  }

  const [kind, id] = action.split(":");
  if (!kind || !id) return;

  try {
    if (kind === "CONFIRM") {
      const b = await prisma.booking.findFirst({ where: { id, customerId: customer.id, status: "confirmed" } });
      if (!b) return;
      await prisma.booking.update({ where: { id }, data: { customerConfirmedAt: new Date() } });
      await reply("Perfetto, ti aspettiamo!");
    } else if (kind === "MOVE") {
      await reply(`Puoi scegliere un nuovo orario qui: ${site.url}/prenota?sposta=${id}`);
    } else if (kind === "CANCEL") {
      const b = await cancelBooking(id, customer.id);
      await onBookingCancelled(b, false);
      await reply(
        b.lateCancellation
          ? "Appuntamento disdetto. Mancavano meno di 24 ore: come da Termini potrebbe essere addebitato il valore del servizio."
          : "Appuntamento disdetto. Grazie di averci avvisato, alla prossima!",
      );
    } else if (kind === "WL") {
      const b = await claimWaitlist(id, customer.id);
      await onBookingCreated(b);
    }
  } catch (e) {
    if (e instanceof BookingError) {
      if (e.code === "card_required" && kind === "WL") await reply(`Per confermare il posto serve una carta a garanzia: ${site.url}/attesa/${id}`);
      else if (e.code === "too_late" && kind === "WL") await reply("Peccato, il posto non è più disponibile. Ti avvisiamo alla prossima occasione.");
      else if (e.code === "too_late") await reply("Non è più possibile modificare questo appuntamento da qui. Scrivici pure.");
      else await reply("Non siamo riusciti a completare l'operazione. Scrivici pure.");
      return;
    }
    throw e;
  }
}
