# Level Up Pesaro

Sito vetrina e prenotazione online di Level Up Hair Salon & Barber Shop.
Specifiche in `docs/HANDOFF.md`, piano di lavoro in `docs/PRIMO_PROMPT.md`, linee guida GEO in `docs/istruzioni_geo.md`.

## Avvio

Serve un database Postgres (in locale, oppure gratuito su Supabase o Neon).

```bash
cp .env.example .env      # poi inserisci DATABASE_URL e DIRECT_URL
npm install
npm run db:migrate        # crea le tabelle
npm run db:seed           # carica listino e impostazioni da src/data/servizi.json
npm run dev
```

Test: `npm test`.

Finché WhatsApp non è collegato, il codice di accesso viene stampato nella console del server
(e mostrato a schermo se `OTP_DEV_SHOW=1`).

## Pubblicare su Vercel (anche solo per provare)

1. Crea un database gratuito su [Neon](https://neon.tech) (regione Europa). Copia la stringa
   "pooled" in `DATABASE_URL` e quella diretta in `DIRECT_URL`.
2. Su [Vercel](https://vercel.com) importa il repository GitHub.
3. In Settings, Environment Variables inserisci almeno `DATABASE_URL`, `DIRECT_URL`,
   `SESSION_SECRET` (stringa casuale di 64 caratteri) e, per le prove, `OTP_DEV_SHOW=1`.
4. Deploy. Lo script `vercel-build` crea le tabelle e carica il listino al primo avvio.

Ogni branch pubblicato su GitHub ottiene un indirizzo di anteprima.

Apri http://localhost:3000.

## Stato

- [x] Fase 1: Next.js + TypeScript + Tailwind, design system, Home, banner cookie, JSON-LD, robots.txt, sitemap
- [x] Fase 2: database Prisma + Postgres (modello §5), seed da `src/data/servizi.json`, pagina /listino dal database
- [x] Fase 3: flusso di prenotazione (servizi, disponibilità, accesso simulato, conferma con lock)
- [x] Fase 4: OTP via WhatsApp Cloud API (attivo con le chiavi), area Account (sposta, disdici, carnet, storico, riprenota)
- [x] Fase 5: carta a garanzia con Stripe SetupIntent (attiva con le chiavi), addebito off-session, Termini e Privacy (bozze)
- [ ] Fase 6: messaggi WhatsApp e cron
- [ ] Fase 7: admin
- [ ] Fase 8: UTM, CSV, test end-to-end

Dati da confermare: orari di default e CAP in `src/lib/site.ts` (gli orari poi vivono nella tabella Settings), contatti in `.env`, e la citazione di Giulia in `src/app/page.tsx`.
