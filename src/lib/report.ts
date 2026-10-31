import { isOnlineSource, sourceLabel } from "./attribution";
import { romeYmd } from "./time";

export type ReportBooking = {
  id: string;
  customerId: string;
  customerName: string;
  start: Date;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  source: string | null;
  utmCampaign: string | null;
  createdByAdmin: boolean;
  fromWaitlist: boolean;
  lateCancellation: boolean;
  finalCents: number;
  services: string[];
};

const inMonth = (d: Date, month: string) => romeYmd(d).startsWith(month);
const live = (b: ReportBooking) => b.status !== "cancelled";

/** Iniziali per il foglio Clienti: "Maria Rossi" -> "M.R." */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join("");
}

export type ClienteRow = {
  dataPrimaVisita: string;
  nome: string;
  fonte: string;
  campagna: string;
  servizio: string;
  importoEuro: number;
  prenotatoDa: string;
  tornato: "Sì" | "No" | "";
  note: string;
};

/** Prima visita (prima prenotazione non disdetta) di ogni cliente. */
function firstVisits(all: ReportBooking[]) {
  const first = new Map<string, ReportBooking>();
  for (const b of [...all].filter(live).sort((a, z) => a.start.getTime() - z.start.getTime())) {
    if (!first.has(b.customerId)) first.set(b.customerId, b);
  }
  return first;
}

/** Righe del foglio "Clienti": nuovi clienti con prima visita nel mese. */
export function newCustomerRows(all: ReportBooking[], month: string, now = new Date()): ClienteRow[] {
  const rows: ClienteRow[] = [];
  for (const [customerId, b] of firstVisits(all)) {
    if (!inMonth(b.start, month)) continue;
    const limit = b.start.getTime() + 60 * 86_400_000;
    const returned = all.some((x) => x.customerId === customerId && live(x) && x.id !== b.id && x.start > b.start && x.start.getTime() <= limit);
    const tornato = returned ? "Sì" : now.getTime() > limit ? "No" : "";
    rows.push({
      dataPrimaVisita: romeYmd(b.start),
      nome: initials(b.customerName),
      fonte: b.createdByAdmin ? "Telefono" : sourceLabel(b.source),
      campagna: b.utmCampaign ?? "",
      servizio: b.services.join(" + "),
      importoEuro: b.finalCents / 100,
      prenotatoDa: b.createdByAdmin ? "Telefono" : "Sito",
      tornato,
      note: b.status === "no_show" ? "Non presentato" : "",
    });
  }
  return rows.sort((a, z) => (a.dataPrimaVisita < z.dataPrimaVisita ? -1 : 1));
}

export type MensileRow = {
  mese: string;
  prenotazioniOnline: number;
  prenotazioniTelefono: number;
  totalePrenotazioni: number;
  percentualeOnline: number | null;
  nuoviClienti: number;
  nuoviClientiOnline: number;
  ricavoPrimoServizioOnlineEuro: number;
  disdetteTardiveNoShow: number;
  slotRecuperati: number;
  disdetteTotali: number;
};

/** Colonne "PRENOTAZIONI", "NUOVI CLIENTI" e "DISDETTE E NO-SHOW" del foglio "Mensile". */
export function monthlyRow(all: ReportBooking[], month: string, now = new Date()): MensileRow {
  const monthBookings = all.filter((b) => inMonth(b.start, month));
  const kept = monthBookings.filter(live);
  const online = kept.filter((b) => !b.createdByAdmin).length;
  const phone = kept.filter((b) => b.createdByAdmin).length;
  const clienti = newCustomerRows(all, month, now);
  const onlineClienti = clienti.filter((c) => isOnlineSource(c.fonte));
  return {
    mese: month,
    prenotazioniOnline: online,
    prenotazioniTelefono: phone,
    totalePrenotazioni: online + phone,
    percentualeOnline: online + phone > 0 ? online / (online + phone) : null,
    nuoviClienti: clienti.length,
    nuoviClientiOnline: onlineClienti.length,
    ricavoPrimoServizioOnlineEuro: onlineClienti.reduce((a, c) => a + c.importoEuro, 0),
    disdetteTardiveNoShow: monthBookings.filter((b) => b.status === "no_show" || (b.status === "cancelled" && b.lateCancellation)).length,
    slotRecuperati: kept.filter((b) => b.fromWaitlist).length,
    disdetteTotali: monthBookings.filter((b) => b.status === "cancelled").length,
  };
}

/** CSV per Excel italiano: separatore ";", virgola decimale, BOM UTF-8. */
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    if (v === null) return "";
    const s = typeof v === "number" ? String(Math.round(v * 100) / 100).replace(".", ",") : v;
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

export const CLIENTI_HEADER = [
  "Data prima visita",
  "Nome / iniziali",
  "Fonte",
  "Campagna (se da sponsorizzata)",
  "Servizio",
  "Importo primo servizio (€)",
  "Prenotato da",
  "Tornato entro 60 gg?",
  "Note",
];

export const MENSILE_HEADER = [
  "Mese",
  "Prenotazioni online (sito)",
  "Prenotazioni tel./WhatsApp",
  "Totale prenotazioni",
  "% online",
  "Nuovi clienti totali",
  "Nuovi clienti da online",
  "Ricavo primo servizio clienti online",
  "Disdette last-minute + no-show",
  "Slot recuperati (lista d'attesa)",
  "Disdette totali",
];
