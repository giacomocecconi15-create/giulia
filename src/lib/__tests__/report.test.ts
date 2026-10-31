import { describe, expect, it } from "vitest";
import { sourceLabel, sourceFromReferrer } from "../attribution";
import { initials, monthlyRow, newCustomerRows, toCsv, type ReportBooking } from "../report";

let n = 0;
const bk = (p: Partial<ReportBooking>): ReportBooking => ({
  id: `b${++n}`,
  customerId: "c1",
  customerName: "Maria Rossi",
  start: new Date("2026-11-10T09:00:00Z"),
  status: "completed",
  source: "online",
  utmCampaign: null,
  createdByAdmin: false,
  fromWaitlist: false,
  lateCancellation: false,
  finalCents: 1600,
  services: ["Taglio donna"],
  ...p,
});

describe("sourceLabel", () => {
  it.each([
    ["ig", "Instagram"],
    ["instagram", "Instagram"],
    ["facebook", "Facebook"],
    ["tiktok", "TikTok"],
    ["gmb", "Google Maps / Ricerca"],
    ["google", "Google Maps / Ricerca"],
    ["online", "Sito web"],
    [null, "Sito web"],
    ["whatsapp", "WhatsApp"],
  ])("%s -> %s", (s, l) => expect(sourceLabel(s)).toBe(l));

  it("riconosce il referrer", () => {
    expect(sourceFromReferrer("https://l.instagram.com/?u=x", "levelup.it")).toBe("instagram");
    expect(sourceFromReferrer("https://www.google.com/", "levelup.it")).toBe("google");
    expect(sourceFromReferrer("https://levelup.it/listino", "levelup.it")).toBeNull();
  });
});

describe("report mensile", () => {
  const now = new Date("2027-02-01T00:00:00Z");
  const data: ReportBooking[] = [
    // Maria: nuova a novembre da Instagram, torna a dicembre
    bk({ customerId: "c1", source: "ig", utmCampaign: "promo-nov", start: new Date("2026-11-10T09:00:00Z") }),
    bk({ customerId: "c1", start: new Date("2026-12-05T09:00:00Z"), finalCents: 2000 }),
    // Paolo: nuovo a novembre al telefono, non torna
    bk({ customerId: "c2", customerName: "Paolo", createdByAdmin: true, source: "telefono", finalCents: 3500, start: new Date("2026-11-12T10:00:00Z") }),
    // Anna: disdetta tardiva a novembre, poi no-show
    bk({ customerId: "c3", customerName: "Anna Bianchi", status: "cancelled", lateCancellation: true, start: new Date("2026-11-15T10:00:00Z") }),
    bk({ customerId: "c3", customerName: "Anna Bianchi", status: "no_show", start: new Date("2026-11-20T10:00:00Z"), source: "google" }),
    // Slot recuperato dalla lista d'attesa (cliente già noto)
    bk({ customerId: "c4", customerName: "Luca", fromWaitlist: true, start: new Date("2026-10-01T10:00:00Z") }),
    bk({ customerId: "c4", customerName: "Luca", fromWaitlist: true, start: new Date("2026-11-15T10:00:00Z") }),
  ];

  it("righe del foglio Clienti", () => {
    const rows = newCustomerRows(data, "2026-11", now);
    expect(rows.map((r) => [r.nome, r.fonte, r.campagna, r.prenotatoDa, r.tornato, r.importoEuro])).toEqual([
      ["M.R.", "Instagram", "promo-nov", "Sito", "Sì", 16],
      ["P.", "Telefono", "", "Telefono", "No", 35],
      ["A.B.", "Google Maps / Ricerca", "", "Sito", "No", 16],
    ]);
    expect(rows[2].note).toBe("Non presentato");
  });

  it("riga del foglio Mensile", () => {
    const m = monthlyRow(data, "2026-11", now);
    expect(m.prenotazioniOnline).toBe(3); // Maria, Anna no-show, Luca
    expect(m.prenotazioniTelefono).toBe(1);
    expect(m.totalePrenotazioni).toBe(4);
    expect(m.percentualeOnline).toBe(0.75);
    expect(m.nuoviClienti).toBe(3);
    expect(m.nuoviClientiOnline).toBe(2);
    expect(m.ricavoPrimoServizioOnlineEuro).toBe(32);
    expect(m.disdetteTardiveNoShow).toBe(2);
    expect(m.slotRecuperati).toBe(1);
    expect(m.disdetteTotali).toBe(1);
  });

  it("'Tornato' vuoto se i 60 giorni non sono passati", () => {
    const rows = newCustomerRows(data, "2026-11", new Date("2026-11-30T00:00:00Z"));
    expect(rows.find((r) => r.nome === "P.")!.tornato).toBe("");
  });
});

describe("toCsv", () => {
  it("usa ; e virgola decimale, con BOM", () => {
    const csv = toCsv(["A", "B"], [["x;y", 12.5], [null, 'di "lui"']]);
    expect(csv).toBe('﻿A;B\r\n"x;y";12,5\r\n;"di ""lui"""\r\n');
  });
  it("iniziali", () => expect(initials("maria de rossi")).toBe("M.D.R."));
});
