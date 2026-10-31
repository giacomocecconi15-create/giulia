import { describe, expect, it } from "vitest";
import { formatEuro, formatPrezzo } from "../format";
import { formatFasce, giorniAperti, giorniChiusi } from "../hours";
import { defaultOpeningHours } from "../site";

const nbsp = (s: string) => s.replace(/ /g, " ");

describe("formatEuro / formatPrezzo", () => {
  it("formatta i centesimi", () => {
    expect(nbsp(formatEuro(2000))).toBe("20 €");
    expect(nbsp(formatEuro(2350))).toBe("23,50 €");
  });
  it("aggiunge 'da' ai prezzi minimi", () => {
    expect(nbsp(formatPrezzo({ priceCents: 5000, priceFrom: true }))).toBe("da 50 €");
  });
});

describe("orari", () => {
  it("elenca i giorni aperti in ordine", () => {
    expect(giorniAperti(defaultOpeningHours).map((d) => d.label)).toEqual([
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ]);
  });
  it("descrive i giorni di chiusura", () => {
    expect(giorniChiusi(defaultOpeningHours)).toBe("Domenica e lunedì");
  });
  it("formatta le fasce", () => {
    expect(formatFasce([["09:00", "12:30"], ["14:30", "19:00"]])).toBe("09:00-12:30, 14:30-19:00");
  });
});
