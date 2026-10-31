import "server-only";
import { site } from "../site";
import { labelGiornoLungo, romeHm, romeYmd } from "../time";
import { sendTemplate, trySend } from "../whatsapp";

type BookingWithDetails = {
  id: string;
  start: Date;
  end: Date;
  customer: { name: string; phone: string };
  items: { service: { name: string } }[];
};

export const when = (d: Date) => ({ day: labelGiornoLungo(romeYmd(d)), time: romeHm(d) });
const servicesOf = (b: BookingWithDetails) => b.items.map((i) => i.service.name).join(", ");

export async function onBookingCreated(b: BookingWithDetails) {
  const w = when(b.start);
  await trySend(() => sendTemplate(b.customer.phone, "confirmation", [b.customer.name, w.day, w.time, servicesOf(b)]), "conferma");
}

export async function onBookingRescheduled(b: BookingWithDetails, previous: { start: Date; end: Date }) {
  await onBookingCreated(b);
  await onSlotFreed(previous.start, previous.end);
}

export async function onBookingCancelled(b: BookingWithDetails, notifyCustomer = true) {
  const w = when(b.start);
  if (notifyCustomer) {
    await trySend(() => sendTemplate(b.customer.phone, "cancellation", [b.customer.name, w.day, w.time]), "disdetta");
  }
  await onSlotFreed(b.start, b.end);
}

/** Uno slot si è liberato: avvisa la lista d'attesa (fase 6). */
export async function onSlotFreed(start: Date, end: Date) {
  const { offerFreedSlot } = await import("./waitlist");
  await offerFreedSlot(start, end);
}

export const accountUrl = () => `${site.url}/account`;
