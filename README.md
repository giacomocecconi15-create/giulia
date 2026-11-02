# Level Up Pesaro

Sito vetrina e prenotazione online di Level Up Hair Salon & Barber Shop.
Specifiche in `docs/HANDOFF.md`, piano di lavoro in `docs/PRIMO_PROMPT.md`, linee guida GEO in `docs/istruzioni_geo.md`.

## Avvio

Serve un database Postgres (in locale, oppure gratuito su Supabase o Neon).

```bash
cp .env.example .env      # poi inserisci DATABASE_URL e DATABASE_URL_UNPOOLED (o usa neon env pull)
npm install
npm run db:migrate        # crea le tabelle
npm run db:seed           # carica listino e impostazioni da src/data/servizi.json
npm run dev
```

Test: `npm test` (unitari) e `E2E=1 npm run test:e2e` (flusso completo nel browser; svuota le
prenotazioni, quindi funziona solo con un database locale).

Finché WhatsApp non è collegato, il codice di accesso viene stampato nella console del server
(e mostrato a schermo se `OTP_DEV_SHOW=1`).

## Pubblicare su Vercel (anche solo per provare)

1. Database su [Neon](https://neon.tech): il progetto è collegato in `.neon` e `neon.ts`.
   `neon login` e poi `neon env pull` scrivono `DATABASE_URL` (pooled) e `DATABASE_URL_UNPOOLED` (diretta, usata da Prisma per le migrazioni).
2. Su [Vercel](https://vercel.com) importa il repository GitHub.
3. In Settings, Environment Variables inserisci almeno `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
   `SESSION_SECRET` (stringa casuale di 64 caratteri) e, per le prove, `OTP_DEV_SHOW=1`.
4. Deploy. Lo script `vercel-build` crea le tabelle e carica il listino al primo avvio.

Ogni branch pubblicato su GitHub ottiene un indirizzo di anteprima.

## Messaggi automatici (cron)

Tutti i compiti periodici passano da `/api/cron/tick`: lista d'attesa, promemoria 24 ore prima,
e una volta al giorno dopo le 18 richiami (45 giorni) e richieste di recensione.

- Imposta `CRON_SECRET`.
- Vercel gratuito permette un cron al giorno (già in `vercel.json`): basta per richiami e recensioni,
  non per i promemoria. Per quelli chiama `https://TUO-SITO/api/cron/tick?key=CRON_SECRET`
  ogni 5-15 minuti da un servizio gratuito come cron-job.org, oppure passa a Vercel Pro e metti
  `"schedule": "*/10 * * * *"`.

## WhatsApp

1. In Meta Business Manager crea i template elencati in `src/lib/whatsapp.ts` (lingua italiano).
   Il promemoria ha tre risposte rapide (Confermo, Sposta, Disdici), l'avviso della lista d'attesa una (Prendo).
2. Inserisci `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.
3. Webhook dell'app Meta: `https://TUO-SITO/api/whatsapp/webhook`, campo `messages`.

Apri http://localhost:3000.

## Stato

- [x] Fase 1: Next.js + TypeScript + Tailwind, design system, Home, banner cookie, JSON-LD, robots.txt, sitemap
- [x] Fase 2: database Prisma + Postgres (modello §5), seed da `src/data/servizi.json`, pagina /listino dal database
- [x] Fase 3: flusso di prenotazione (servizi, disponibilità, accesso simulato, conferma con lock)
- [x] Fase 4: OTP via WhatsApp Cloud API (attivo con le chiavi), area Account (sposta, disdici, carnet, storico, riprenota)
- [x] Fase 5: carta a garanzia con Stripe SetupIntent (attiva con le chiavi), addebito off-session, Termini e Privacy (bozze)
- [x] Fase 6: conferma, promemoria 24h con risposte rapide, lista d'attesa, richiamo 45 giorni, recensioni, webhook WhatsApp
- [x] Fase 7: admin mobile per Giulia (agenda giorno e settimana, blocchi, ferie, prenotazioni telefoniche, no-show e addebito, listino, orari e regole, lista d'attesa)
- [x] Fase 8: UTM e provenienza su ogni prenotazione, report mensile con CSV per il file Excel, test end-to-end

Dati da confermare: orari di default e CAP in `src/lib/site.ts` (gli orari poi vivono nella tabella Settings), contatti in `.env`, e la citazione di Giulia in `src/app/page.tsx`.

## Link tracciati (report mensile)

Ogni prenotazione salva da dove arriva il cliente. Usa questi link:

| Dove | Link |
|---|---|
| Bio Instagram | `https://TUO-SITO/?utm_source=instagram&utm_medium=bio` |
| Bio TikTok | `https://TUO-SITO/?utm_source=tiktok&utm_medium=bio` |
| Profilo Google | `https://TUO-SITO/?utm_source=google&utm_medium=gbp` |
| Sponsorizzata Meta | `https://TUO-SITO/?utm_source=instagram&utm_medium=paid&utm_campaign=NOME-CAMPAGNA` |

Senza UTM il sito prova a riconoscere la provenienza dal referrer (Instagram, Facebook, TikTok, Google).

In admin, Altro, Report mensile: indicatori del mese e due CSV (separatore `;`) con le colonne dei
fogli "Mensile" e "Clienti" di `docs/LevelUp_Monitoraggio_Marketing.xlsx`.
