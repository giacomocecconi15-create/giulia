import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <LegalPage
      title="Informativa privacy"
      updated="31 ottobre 2026"
      sections={[
        {
          id: "titolare",
          title: "Titolare del trattamento",
          body: (
            <p>
              {site.name}, {site.address.street}, {site.address.city}. Ragione sociale, P.IVA ed email: <em>da inserire</em>.
            </p>
          ),
        },
        {
          id: "dati",
          title: "Quali dati trattiamo",
          body: (
            <ul>
              <li><strong>Dati di contatto</strong>: nome e numero di cellulare.</li>
              <li><strong>Profilo facoltativo</strong>: breve bio, fascia d&apos;età e tipo di capelli, se scegli di compilarli. Servono a Giulia per preparare l&apos;appuntamento e, in forma aggregata e anonima, per statistiche interne. Puoi modificarli o cancellarli quando vuoi dall&apos;area Account.</li>
              <li><strong>Prenotazioni</strong>: servizi, date, stato (confermata, disdetta, completata), prezzi e sconti.</li>
              <li><strong>Carta di pagamento</strong>: i dati della carta sono raccolti e conservati da Stripe; noi conserviamo solo un identificativo e le ultime 4 cifre.</li>
              <li><strong>Dati tecnici</strong>: indirizzo IP per sicurezza e limitazione degli abusi nell&apos;invio dei codici.</li>
              <li><strong>Provenienza</strong>: il canale da cui arrivi (per esempio Instagram o Google), per misurare i risultati delle nostre comunicazioni.</li>
            </ul>
          ),
        },
        {
          id: "finalita",
          title: "Perché e su quale base",
          body: (
            <ul>
              <li>Gestire account e prenotazioni, inviare conferme e promemoria: <strong>esecuzione del contratto</strong>.</li>
              <li>Addebiti per mancata presentazione o disdetta tardiva secondo i Termini: <strong>esecuzione del contratto</strong>.</li>
              <li>Sicurezza del servizio e prevenzione degli abusi: <strong>legittimo interesse</strong>.</li>
              <li>Obblighi fiscali e contabili: <strong>obbligo di legge</strong>.</li>
              <li>Messaggi per ricordarti di tornare e richieste di recensione: <strong>consenso</strong>, revocabile in ogni momento dall&apos;area Account.</li>
              <li>Statistiche e marketing tramite cookie: <strong>consenso</strong>, vedi la pagina Cookie.</li>
            </ul>
          ),
        },
        {
          id: "destinatari",
          title: "A chi li comunichiamo",
          body: (
            <ul>
              <li>Fornitori che trattano i dati per nostro conto come responsabili: hosting (Vercel), database (Neon o Supabase), Meta Platforms (WhatsApp Business), Stripe (pagamenti).</li>
              <li>Alcuni fornitori possono trasferire dati fuori dall&apos;UE con le garanzie previste dal GDPR (clausole contrattuali standard o decisioni di adeguatezza).</li>
              <li>Non vendiamo i tuoi dati.</li>
            </ul>
          ),
        },
        {
          id: "conservazione",
          title: "Per quanto tempo",
          body: (
            <ul>
              <li>Account e storico prenotazioni: fino a 24 mesi dall&apos;ultima visita, poi cancellati o anonimizzati (<em>da confermare</em>).</li>
              <li>Codici di accesso: pochi giorni.</li>
              <li>Sessione di accesso: scade dopo 30 minuti di inattività o alla chiusura del browser.</li>
              <li>Documenti fiscali: 10 anni, come previsto dalla legge.</li>
            </ul>
          ),
        },
        {
          id: "diritti",
          title: "I tuoi diritti",
          body: (
            <p>
              Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento scrivendoci. Puoi
              revocare il consenso in qualsiasi momento. Hai diritto di presentare reclamo al Garante per la protezione dei dati
              personali (garanteprivacy.it).
            </p>
          ),
        },
      ]}
    />
  );
}
