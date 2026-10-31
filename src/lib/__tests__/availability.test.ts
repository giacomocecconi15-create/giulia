import { describe, expect, it } from "vitest";
import { bookingDurationMinutes, computeAvailability, isSlotAvailable, type AvailabilityParams } from "../booking/availability";
import { romeLocalToUtc } from "../time";
import { defaultOpeningHours } from "../site";

// Martedì 3 novembre 2026: 09:00-12:30 e 14:30-19:00
const TUE = "2026-11-03";
const base: AvailabilityParams = {
  from: TUE,
  days: 1,
  durationMin: 30,
  openingHours: defaultOpeningHours,
  slotMinutes: 30,
  busy: [],
  now: new Date("2026-11-01T08:00:00Z"),
  minLeadMinutes: 60,
  lastDay: "2026-12-31",
};
const times = (p: Partial<AvailabilityParams>) => computeAvailability({ ...base, ...p })[0]?.slots.map((s) => s.time) ?? [];
const at = (hm: string, ymd = TUE) => romeLocalToUtc(ymd, hm);

describe("bookingDurationMinutes", () => {
  it("somma e arrotonda a blocchi di 30", () => {
    expect(bookingDurationMinutes([30], 30)).toBe(30);
    expect(bookingDurationMinutes([40], 30)).toBe(60); // piega
    expect(bookingDurationMinutes([30, 15], 30)).toBe(60); // taglio + trattamento
    expect(bookingDurationMinutes([60, 75], 30)).toBe(150);
    expect(bookingDurationMinutes([], 30)).toBe(0);
  });
});

describe("computeAvailability", () => {
  it("genera slot ogni 30 minuti in entrambe le fasce", () => {
    const t = times({});
    expect(t[0]).toBe("09:00");
    expect(t).toContain("12:00");
    expect(t).not.toContain("12:30"); // finirebbe dopo la chiusura della mattina
    expect(t).toContain("14:30");
    expect(t.at(-1)).toBe("18:30");
    expect(t).toHaveLength(7 + 9);
  });

  it("non scavalca la pausa pranzo", () => {
    const t = times({ durationMin: 90 });
    expect(t).toContain("11:00"); // 11:00-12:30
    expect(t).not.toContain("11:30"); // finirebbe alle 13:00
    expect(t).not.toContain("12:00");
    expect(t).toContain("14:30");
    expect(t.at(-1)).toBe("17:30");
  });

  it("un servizio più lungo di una fascia non trova posto la mattina", () => {
    const t = times({ durationMin: 240 });
    expect(t.every((x) => x >= "14:30")).toBe(true);
    expect(t).toEqual(["14:30", "15:00"]); // pomeriggio di 270 minuti
  });

  it("esclude gli slot sovrapposti a prenotazioni e blocchi", () => {
    const t = times({
      durationMin: 60,
      busy: [
        { start: at("10:00"), end: at("10:30") }, // prenotazione
        { start: at("15:00"), end: at("17:00") }, // blocco
      ],
    });
    expect(t).toContain("09:00");
    expect(t).not.toContain("09:30"); // 09:30-10:30 tocca 10:00
    expect(t).not.toContain("10:00");
    expect(t).toContain("10:30");
    expect(t).not.toContain("14:30"); // 14:30-15:30
    expect(t).toContain("17:00");
  });

  it("uno slot che finisce quando inizia un'altra prenotazione è valido", () => {
    const t = times({ busy: [{ start: at("09:30"), end: at("10:00") }] });
    expect(t).toContain("09:00");
    expect(t).not.toContain("09:30");
    expect(t).toContain("10:00");
  });

  it("rispetta il preavviso minimo", () => {
    const now = at("10:10"); // martedì alle 10:10, preavviso 60 min
    const t = times({ now });
    expect(t[0]).toBe("11:30");
  });

  it("i giorni di chiusura non hanno slot", () => {
    const [mon] = computeAvailability({ ...base, from: "2026-11-02" });
    expect(mon.slots).toEqual([]);
  });

  it("si ferma all'ultimo giorno prenotabile", () => {
    const res = computeAvailability({ ...base, days: 10, lastDay: "2026-11-05" });
    expect(res.map((d) => d.date)).toEqual(["2026-11-03", "2026-11-04", "2026-11-05"]);
  });

  it("gestisce il cambio d'ora: gli orari restano locali", () => {
    // Sabato 27 marzo 2027 (ora solare) e sabato 3 aprile (ora legale)
    const winter = computeAvailability({ ...base, from: "2027-03-27", lastDay: "2027-12-31" })[0].slots[0];
    const summer = computeAvailability({ ...base, from: "2027-04-03", lastDay: "2027-12-31" })[0].slots[0];
    expect(winter.time).toBe("09:00");
    expect(winter.start.toISOString()).toBe("2027-03-27T08:00:00.000Z");
    expect(summer.time).toBe("09:00");
    expect(summer.start.toISOString()).toBe("2027-04-03T07:00:00.000Z");
  });
});

describe("isSlotAvailable", () => {
  it("accetta solo inizi validi", () => {
    expect(isSlotAvailable(at("09:00"), base)).toBe(true);
    expect(isSlotAvailable(at("09:15"), base)).toBe(false); // non allineato
    expect(isSlotAvailable(at("13:00"), base)).toBe(false); // pausa pranzo
    expect(isSlotAvailable(at("09:00"), { ...base, busy: [{ start: at("09:00"), end: at("09:30") }] })).toBe(false);
  });
});
