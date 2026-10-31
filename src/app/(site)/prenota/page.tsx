import type { Metadata } from "next";
import BookingFlow, { type Reschedule } from "@/components/booking/BookingFlow";
import { prisma } from "@/lib/db";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";
import { getInfoSalone, getListino } from "@/lib/data";
import { getCurrentCustomer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Prenota online",
  description: "Prenota taglio, colore, schiariture o barba da Level Up a Pesaro. Scegli i servizi, il giorno e l'ora.",
  alternates: { canonical: "/prenota" },
};

export const dynamic = "force-dynamic";

export default async function Prenota({ searchParams }: { searchParams: Promise<{ servizi?: string; sposta?: string }> }) {
  const [listino, info, customer, sp] = await Promise.all([getListino(), getInfoSalone(), getCurrentCustomer(), searchParams]);
  let reschedule: Reschedule | null = null;
  if (sp.sposta && customer) {
    const b = await prisma.booking.findUnique({ where: { id: sp.sposta }, include: { items: true } });
    if (b && b.customerId === customer.id && b.status === "confirmed" && b.start > new Date()) {
      reschedule = {
        bookingId: b.id,
        serviceIds: b.items.map((i) => i.serviceId),
        currentLabel: `${labelGiornoLungo(romeYmd(b.start))}, ore ${romeHm(b.start)}`,
      };
    }
  }
  return (
    <main id="contenuto">
      <BookingFlow
        listino={listino}
        promoActive={info.promoActive}
        discountPct={info.discountPct}
        initialCustomer={customer ? { name: customer.name, phone: customer.phone } : null}
        preselected={(sp.servizi ?? "").split(",").filter(Boolean)}
        reschedule={reschedule}
      />
    </main>
  );
}
