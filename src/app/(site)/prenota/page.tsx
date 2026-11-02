import type { Metadata } from "next";
import BookingFlow, { type Reschedule } from "@/components/booking/BookingFlow";
import JsonLd from "@/components/JsonLd";
import { catalogo, categorieDaSezione } from "@/data/catalogo";
import { formatPrezzo } from "@/lib/format";
import { offerCatalogSchema } from "@/lib/schema";
import { prisma } from "@/lib/db";
import { labelGiornoLungo, romeHm, romeYmd } from "@/lib/time";
import { getInfoSalone, getListino } from "@/lib/data";
import { getCurrentCustomer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Prenota online",
  description:
    "Prenota da Level Up a Pesaro: guarda i lavori di Giulia e scegli subito giorno e ora. Taglio donna e uomo, piega, colore, schiariture, cheratina, trattamenti e barba, con prezzi.",
  alternates: { canonical: "/prenota" },
};

export const dynamic = "force-dynamic";

export default async function Prenota({ searchParams }: { searchParams: Promise<{ servizi?: string; sposta?: string }> }) {
  const [listino, info, customer, sp] = await Promise.all([getListino(), getInfoSalone(), getCurrentCustomer(), searchParams]);
  const voci = listino.flatMap((sezione) =>
    sezione.services.map((s) => ({
      id: s.id,
      name: s.name,
      priceLabel: formatPrezzo(s),
      priceCents: s.priceCents,
      promoEligible: s.promoEligible,
      categorie: catalogo[s.id]?.categorie ?? categorieDaSezione(sezione.id),
      descrizione: catalogo[s.id]?.descrizione ?? sezione.name,
      video: catalogo[s.id]?.video,
      immagine: catalogo[s.id]?.immagine,
      videoIA: catalogo[s.id]?.videoIA,
    })),
  );
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
      <JsonLd data={offerCatalogSchema(listino)} />
      <BookingFlow
        listino={listino}
        voci={voci}
        promoActive={info.promoActive}
        discountPct={info.discountPct}
        initialCustomer={customer ? { name: customer.name, phone: customer.phone } : null}
        preselected={(sp.servizi ?? "").split(",").filter(Boolean)}
        reschedule={reschedule}
      />
    </main>
  );
}
