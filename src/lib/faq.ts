import type { InfoSalone } from "./data";
import { giorniChiusi } from "./hours";
import { formatEuro } from "./format";
import { site } from "./site";

type Prezzi = Record<string, number | undefined>;

export function buildFaq(info: InfoSalone, prezzi: Prezzi): { q: string; a: string }[] {
  const chiusi = giorniChiusi(info.openingHours);
  const p = (id: string) => (prezzi[id] != null ? formatEuro(prezzi[id]!) : null);
  const tagli = [
    p("taglio-donna") && `il taglio donna costa ${p("taglio-donna")}`,
    p("taglio-uomo") && `il taglio uomo ${p("taglio-uomo")}`,
    p("piega") && `la piega ${p("piega")}`,
  ].filter(Boolean);

  return [
    {
      q: "Come prenoto un appuntamento da Level Up?",
      a: "Dal sito: premi Prenota, scegli uno o più servizi, poi il giorno e l'ora. Ti chiediamo solo il numero di cellulare, ricevi un codice su WhatsApp e confermi. Niente email e niente password.",
    },
    ...(tagli.length
      ? [
          {
            q: "Quanto costa un taglio da Level Up a Pesaro?",
            a: `${tagli.join(", ")}. Il listino completo è in questa pagina.`.replace(/^./, (c) => c.toUpperCase()),
          },
        ]
      : []),
    ...(info.promoActive
      ? [
          {
            q: "Come funziona lo sconto sulla prima visita?",
            a: `Alla prima visita hai il ${info.discountPct}% di sconto su taglio donna, taglio uomo e piega, per prenotazioni fatte entro il ${info.promoEndLabel}. Lo sconto compare nel riepilogo prima della conferma.`,
          },
        ]
      : []),
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
      a: `In ${site.address.street} a ${site.address.city}.${chiusi ? ` Giorni di chiusura: ${chiusi.toLowerCase()}.` : ""} Gli orari completi sono in fondo alla pagina.`,
    },
    {
      q: "Chi mi farà il taglio?",
      a: `${site.operator}, che segue ogni cliente dall'inizio alla fine. In salone lavora una sola persona, quindi l'appuntamento è tutto dedicato a te.`,
    },
  ];
}
