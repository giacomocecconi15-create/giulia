# Level Up Pesaro

Sito vetrina e prenotazione online di Level Up Hair Salon & Barber Shop.
Specifiche in `docs/HANDOFF.md`, piano di lavoro in `docs/PRIMO_PROMPT.md`, linee guida GEO in `docs/istruzioni_geo.md`.

## Avvio

```bash
cp .env.example .env.local
npm install
npm run dev
```

Apri http://localhost:3000.

## Stato

- [x] Fase 1: Next.js + TypeScript + Tailwind, design system, Home, banner cookie, JSON-LD, robots.txt, sitemap
- [ ] Fase 2: database Prisma + Postgres, seed da `src/data/servizi.json`
- [ ] Fase 3: flusso di prenotazione
- [ ] Fase 4: login OTP WhatsApp e area Account
- [ ] Fase 5: Stripe SetupIntent, Termini
- [ ] Fase 6: messaggi WhatsApp e cron
- [ ] Fase 7: admin
- [ ] Fase 8: UTM, CSV, test end-to-end

Dati da confermare in `src/lib/site.ts` (orari, CAP, contatti) e la citazione di Giulia in `src/app/page.tsx`.
