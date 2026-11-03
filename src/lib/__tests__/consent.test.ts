import { describe, expect, it } from "vitest";
import { parseConsent } from "../../components/CookieConsent";

const today = 20000;
describe("parseConsent", () => {
  it("accetta solo il formato attuale e recente", () => {
    expect(parseConsent("v1.accepted.19990", today)).toBe("accepted");
    expect(parseConsent("v1.rejected.20000", today)).toBe("rejected");
  });
  it("vecchio formato, altra versione o malformato: nessuna scelta (banner)", () => {
    expect(parseConsent("accepted", today)).toBeNull();
    expect(parseConsent("v2.accepted.19990", today)).toBeNull();
    expect(parseConsent("v1.maybe.19990", today)).toBeNull();
    expect(parseConsent(undefined, today)).toBeNull();
  });
  it("dopo 6 mesi il banner ricompare", () => {
    expect(parseConsent("v1.accepted.19819", today)).toBeNull(); // 181 giorni fa
    expect(parseConsent("v1.accepted.19821", today)).toBe("accepted");
  });
});
