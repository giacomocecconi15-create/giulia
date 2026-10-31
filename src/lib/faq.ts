import { promo, site } from "./site";

export const faq: { q: string; a: string }[] = [
  {
    q: "Come prenoto un appuntamento da Level Up?",
    a: "Dal sito: premi Prenota, scegli uno o più servizi, poi il giorno e l'ora. Ti chiediamo solo il numero di cellulare, ricevi un codice su WhatsApp e confermi. Niente email e niente password.",
  },
  {
    q: "Quanto costa un taglio da Level Up a Pesaro?",
    a: "Il taglio donna costa 20 €, il taglio uomo 25 €, la piega 23 €. Il listino completo è in questa pagina.",
  },
  {
    q: "Come funziona lo sconto sulla prima visita?",
    a: `Alla prima visita hai il ${promo.discountPercent}% di sconto su taglio donna, taglio uomo e piega, per prenotazioni fatte entro il ${promo.endLabel}. Lo sconto compare nel riepilogo prima della conferma.`,
  },
  {
    q: "Devo pagare in anticipo per prenotare?",
    a: "No. Al momento della prenotazione salvi una carta a garanzia: non viene addebitato nulla e non viene bloccato nessun importo. Paghi in salone dopo il servizio.",
  },
  {
    q: "Posso spostare o disdire un appuntamento?",
    a: "Sì, dalla tua area personale. Disdire o spostare è gratuito fino a 24 ore prima. Per disdette nelle ultime 24 ore o mancata presentazione può essere addebitato il valore del servizio.",
  },
  {
    q: "Dove si trova Level Up?",
    a: `In ${site.address.street} a ${site.address.city}. Il salone è aperto dal martedì al sabato; ${site.closedDays.toLowerCase()} siamo chiusi.`,
  },
  {
    q: "Chi mi farà il taglio?",
    a: `${site.operator}, che segue ogni cliente dall'inizio alla fine. In salone lavora una sola persona, quindi l'appuntamento è tutto dedicato a te.`,
  },
];
