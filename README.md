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

Test: `npm test`. Anteprima statica senza Node: `npm run anteprima` (cartella `out/`).

Apri http://localhost:3000.

## Stato

- [x] Fase 1: Next.js + TypeScript + Tailwind, design system, Home, banner cookie, JSON-LD, robots.txt, sitemap
- [x] Fase 2: database Prisma + Postgres (modello §5), seed da `src/data/servizi.json`, pagina /listino dal database
- [ ] Fase 3: flusso di prenotazione
- [ ] Fase 4: login OTP WhatsApp e area Account
- [ ] Fase 5: Stripe SetupIntent, Termini
- [ ] Fase 6: messaggi WhatsApp e cron
- [ ] Fase 7: admin
- [ ] Fase 8: UTM, CSV, test end-to-end

Dati da confermare: orari di default e CAP in `src/lib/site.ts` (gli orari poi vivono nella tabella Settings), contatti in `.env`, e la citazione di Giulia in `src/app/page.tsx`.
