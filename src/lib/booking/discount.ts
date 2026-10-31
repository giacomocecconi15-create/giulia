import { isPromoActive } from "../promo";

export type QuoteItem = { priceCents: number; promoEligible: boolean };

export type DiscountParams = {
  items: QuoteItem[];
  /** Cliente senza visite completate e senza altre prenotazioni scontate attive */
  isFirstVisit: boolean;
  /** Momento in cui viene creata la prenotazione */
  createdAt: Date;
  promoEndDate: Date;
  discountPct: number;
};

export type Quote = { totalCents: number; discountCents: number; finalCents: number; eligibleCents: number };

/**
 * Sconto prima visita (§6): percentuale solo sui servizi promoEligible,
 * solo alla prima visita e solo per prenotazioni create entro la scadenza.
 * Arrotondato al centesimo.
 */
export function computeQuote(p: DiscountParams): Quote {
  const totalCents = p.items.reduce((a, i) => a + i.priceCents, 0);
  const eligibleCents = p.items.filter((i) => i.promoEligible).reduce((a, i) => a + i.priceCents, 0);
  const applies = p.isFirstVisit && p.discountPct > 0 && isPromoActive(p.promoEndDate, p.createdAt);
  const discountCents = applies ? Math.round((eligibleCents * p.discountPct) / 100) : 0;
  return { totalCents, discountCents, finalCents: totalCents - discountCents, eligibleCents };
}
