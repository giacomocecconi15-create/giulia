import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { loadSettings } from "@/lib/booking/server";
import { CUTS_FOR_REWARD, REWARD_LABEL } from "@/lib/carnet";
import { formatDataLunga } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Termini e condizioni", alternates: { canonical: "/termini" } };
export const revalidate = 3600;

export default async function Termini() {
  const s = await loadSettings();
  const h = s.freeCancellationHours;
  return (
    <LegalPage
      title="Termini e condizioni"
      updated="31 ottobre 2026"
      sections={[
        {
          id: "titolare",
          title: "Chi siamo",
          body: (
            <p>
              Il servizio è offerto da <strong>{site.name}</strong>, {site.address.street}, {site.address.postalCode}{" "}
              {site.address.city}. Ragione sociale e P.IVA: <em>da inserire</em>. Contatti: WhatsApp e telefono indicati nel sito.
            </p>
          ),
        },
        {
          id: "servizi",
          title: "Servizi e prezzi",
          body: (
            <ul>
              <li>I prezzi sono quelli del listino pubblicato sul sito al momento della prenotazione, in euro, IVA inclusa.</li>
              <li>I prezzi con la dicitura &ldquo;da&rdquo; sono indicativi: il prezzo finale dipende da lunghezza e quantità dei capelli e viene comunicato in salone prima del servizio.</li>
              <li>Il pagamento avviene in salone, dopo il servizio.</li>
            </ul>
          ),
        },
        {
          id: "prenotazione",
          title: "Prenotazione online",
          body: (
            <ul>
              <li>Per prenotare servono un numero di cellulare e un codice di verifica inviato su WhatsApp.</li>
              <li>La prenotazione è confermata quando compare la schermata di conferma; ricevi anche un messaggio WhatsApp.</li>
              <li>Ti mandiamo un promemoria circa 24 ore prima dell&apos;appuntamento.</li>
            </ul>
          ),
        },
        {
          id: "carta",
          title: "Carta a garanzia",
          body: (
            <>
              <p>
                Per confermare una prenotazione online ti chiediamo di salvare una carta di pagamento tramite <strong>Stripe</strong>.
                Al momento della prenotazione <strong>non viene addebitato nulla e non viene bloccato alcun importo</strong>.
              </p>
              <p>
                La carta può essere addebitata, solo con un&apos;operazione manuale del salone, del valore dei servizi prenotati nei casi
                previsti ai punti 5 e 6. Il salone non vede né conserva i dati completi della carta.
              </p>
            </>
          ),
        },
        {
          id: "disdetta",
          title: "Disdetta e modifica",
          body: (
            <ul>
              <li>Puoi disdire o spostare <strong>gratuitamente fino a {h} ore prima</strong> dall&apos;area Account, dal promemoria WhatsApp o scrivendoci.</li>
              <li>Nelle ultime {h} ore lo spostamento online non è disponibile: scrivici su WhatsApp e cercheremo una soluzione.</li>
              <li>In caso di disdetta nelle ultime {h} ore può essere addebitato il valore dei servizi prenotati.</li>
            </ul>
          ),
        },
        {
          id: "noshow",
          title: "Mancata presentazione e ritardi",
          body: (
            <ul>
              <li>Se non ti presenti senza avvisare, può essere addebitato il valore dei servizi prenotati.</li>
              <li>Oltre <strong>{s.maxLateMinutes} minuti di ritardo</strong> l&apos;appuntamento potrebbe essere ridotto o considerato come mancata presentazione, per rispetto dei clienti successivi.</li>
              <li>In caso di imprevisti gravi e documentati il salone valuta di non applicare l&apos;addebito.</li>
            </ul>
          ),
        },
        {
          id: "promozione",
          title: "Promozione prima visita",
          body: (
            <ul>
              <li><strong>Sconto del {s.discountPct}%</strong> su <strong>taglio donna, taglio uomo e piega</strong>. Gli altri servizi della stessa prenotazione sono a prezzo pieno.</li>
              <li>Valida per chi non ha mai completato una visita da Level Up, per <strong>prenotazioni online create entro il {formatDataLunga(s.promoEndDate)}</strong>, anche per appuntamenti successivi a quella data.</li>
              <li>Una sola prenotazione scontata per cliente (numero di cellulare). Non cumulabile con altre promozioni o con il premio del carnet.</li>
              <li>Lo sconto viene mostrato nel riepilogo prima della conferma. Se la prenotazione scontata viene disdetta, lo sconto torna disponibile.</li>
            </ul>
          ),
        },
        {
          id: "attesa",
          title: "Lista d'attesa",
          body: (
            <p>
              Se un giorno è pieno puoi iscriverti alla lista d&apos;attesa. Quando si libera un posto adatto avvisiamo su WhatsApp le
              persone in ordine di iscrizione, una alla volta: il posto resta riservato a chi riceve l&apos;avviso per{" "}
              <strong>15 minuti</strong>, poi passa alla persona successiva.
            </p>
          ),
        },
        {
          id: "carnet",
          title: "Carnet",
          body: (
            <p>
              Ogni {CUTS_FOR_REWARD} tagli completati ricevi {REWARD_LABEL}. Il premio è personale, non convertibile in denaro e va
              usato entro 12 mesi (<em>condizioni da confermare</em>).
            </p>
          ),
        },
        {
          id: "messaggi",
          title: "Messaggi WhatsApp",
          body: (
            <p>
              Usiamo WhatsApp per codici di accesso, conferme, promemoria, avvisi della lista d&apos;attesa e disdette. Solo con il tuo
              consenso, revocabile in qualsiasi momento dall&apos;area Account, ti scriviamo anche per ricordarti di tornare e per
              chiederti una recensione.
            </p>
          ),
        },
        {
          id: "legge",
          title: "Legge applicabile e reclami",
          body: (
            <p>
              Si applicano la legge italiana e il Codice del Consumo (D.Lgs. 206/2005). Per qualsiasi problema scrivici: rispondiamo
              entro pochi giorni. Restano salvi i diritti previsti per i consumatori, incluso il foro del consumatore.
            </p>
          ),
        },
      ]}
    />
  );
}
