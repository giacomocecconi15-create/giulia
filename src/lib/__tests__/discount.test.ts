import { describe, expect, it } from "vitest";
import { computeQuote } from "../booking/discount";

const promoEndDate = new Date("2026-11-30T00:00:00Z");
const taglioDonna = { priceCents: 2000, promoEligible: true };
const piega = { priceCents: 2300, promoEligible: true };
const colore = { priceCents: 3500, promoEligible: false };
const base = { isFirstVisit: true, createdAt: new Date("2026-11-10T10:00:00Z"), promoEndDate, discountPct: 20 };

describe("computeQuote", () => {
  it("applica il 20% ai servizi in promo", () => {
    expect(computeQuote({ ...base, items: [taglioDonna] })).toEqual({
      totalCents: 2000,
      discountCents: 400,
      finalCents: 1600,
      eligibleCents: 2000,
    });
  });

  it("lo sconto vale solo sui servizi promoEligible", () => {
    const q = computeQuote({ ...base, items: [taglioDonna, colore] });
    expect(q.totalCents).toBe(5500);
    expect(q.discountCents).toBe(400);
    expect(q.finalCents).toBe(5100);
  });

  it("arrotonda al centesimo", () => {
    expect(computeQuote({ ...base, items: [piega] }).discountCents).toBe(460);
    expect(computeQuote({ ...base, discountPct: 15, items: [{ priceCents: 2333, promoEligible: true }] }).discountCents).toBe(350);
  });

  it("niente sconto se non è la prima visita", () => {
    expect(computeQuote({ ...base, isFirstVisit: false, items: [taglioDonna] }).discountCents).toBe(0);
  });

  it("niente sconto senza servizi in promo", () => {
    expect(computeQuote({ ...base, items: [colore] }).discountCents).toBe(0);
  });

  it("vale per prenotazioni create entro il 30/11 compreso, ora di Roma", () => {
    const ultimoMinuto = new Date("2026-11-30T22:59:00Z"); // 23:59 a Roma
    const dopo = new Date("2026-11-30T23:00:01Z"); // 00:00 del 1/12 a Roma
    expect(computeQuote({ ...base, createdAt: ultimoMinuto, items: [taglioDonna] }).discountCents).toBe(400);
    expect(computeQuote({ ...base, createdAt: dopo, items: [taglioDonna] }).discountCents).toBe(0);
  });
});
