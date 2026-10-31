import { describe, expect, it } from "vitest";
import { isPromoActive, romeOffsetMinutes } from "../promo";

const end = new Date("2026-11-30T00:00:00Z");

describe("isPromoActive", () => {
  it("è attiva prima della scadenza", () => {
    expect(isPromoActive(end, new Date("2026-10-31T10:00:00Z"))).toBe(true);
  });
  it("è attiva fino alle 23:59:59 di Roma dell'ultimo giorno", () => {
    // 30/11 23:59:00 a Roma = 22:59 UTC (ora solare)
    expect(isPromoActive(end, new Date("2026-11-30T22:59:00Z"))).toBe(true);
  });
  it("scade a mezzanotte di Roma", () => {
    // 01/12 00:00:30 a Roma = 30/11 23:00:30 UTC
    expect(isPromoActive(end, new Date("2026-11-30T23:00:30Z"))).toBe(false);
  });
});

describe("romeOffsetMinutes", () => {
  it("60 in inverno, 120 in estate", () => {
    expect(romeOffsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(60);
    expect(romeOffsetMinutes(new Date("2026-07-15T12:00:00Z"))).toBe(120);
  });
});
