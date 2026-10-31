import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { formatDataLunga } from "./format";
import { isPromoActive } from "./promo";
import { defaultOpeningHours, promo, type OpeningHours } from "./site";

export type ServizioPubblico = {
  id: string;
  name: string;
  priceCents: number;
  priceMaxCents: number | null;
  priceFrom: boolean;
  promoEligible: boolean;
};

export type SezioneListino = { id: string; name: string; services: ServizioPubblico[] };

/**
 * Listino pubblico dal database. La durata NON viene selezionata:
 * non deve mai arrivare al cliente.
 */
export const getListino = cache(async (): Promise<SezioneListino[]> => {
  const sections = await prisma.serviceSection.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, priceCents: true, priceMaxCents: true, priceFrom: true, promoEligible: true },
      },
    },
  });
  return sections.filter((s) => s.services.length > 0);
});

export type InfoSalone = {
  openingHours: OpeningHours;
  promoActive: boolean;
  discountPct: number;
  promoEndLabel: string;
};

/** Orari e promo dalla tabella Settings (con i default se manca la riga). */
export const getInfoSalone = cache(async (): Promise<InfoSalone> => {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  const endDate = s?.promoEndDate ?? new Date(`${promo.endDate}T00:00:00Z`);
  return {
    openingHours: (s?.openingHours as OpeningHours | undefined) ?? defaultOpeningHours,
    promoActive: isPromoActive(endDate),
    discountPct: s?.firstVisitDiscountPct ?? promo.discountPercent,
    promoEndLabel: formatDataLunga(endDate),
  };
});
