import data from "@/data/servizi.json";

export type Servizio = {
  id: string;
  nome: string;
  prezzo: number;
  prezzoMax?: number;
  prezzoDa?: boolean;
  /** Solo per l'agenda: MAI mostrare al cliente. */
  durationMin: number;
  promoEligible: boolean;
  daVerificare?: string;
};

export type Sezione = { id: string; nome: string; servizi: Servizio[] };

/**
 * Listino statico (fase 1). Dalla fase 2 verrà letto dal database.
 * La durata viene rimossa qui, così non arriva mai ai componenti pubblici.
 */
export function getListino(): { id: string; nome: string; servizi: Omit<Servizio, "durationMin">[] }[] {
  return (data.sezioni as Sezione[]).map((s) => ({
    id: s.id,
    nome: s.nome,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    servizi: s.servizi.map(({ durationMin, ...rest }) => rest),
  }));
}

const eur = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrezzo(s: { prezzo: number; prezzoDa?: boolean }): string {
  return s.prezzoDa ? `da ${eur.format(s.prezzo)}` : eur.format(s.prezzo);
}
