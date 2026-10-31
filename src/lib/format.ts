const eurIntero = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurDecimali = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

/** 2000 -> "20 €", 2350 -> "23,50 €" */
export function formatEuro(cents: number): string {
  return (cents % 100 === 0 ? eurIntero : eurDecimali).format(cents / 100);
}

export function formatPrezzo(s: { priceCents: number; priceFrom: boolean }): string {
  return s.priceFrom ? `da ${formatEuro(s.priceCents)}` : formatEuro(s.priceCents);
}

const dataLunga = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Data "solo giorno" (salvata a mezzanotte UTC) -> "30 novembre 2026" */
export function formatDataLunga(d: Date): string {
  return dataLunga.format(d);
}
