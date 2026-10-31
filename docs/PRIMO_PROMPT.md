# Primo messaggio da incollare in Claude Code

Copia questa cartella nel nuovo progetto, apri Claude Code nella cartella e incolla:

---

Leggi HANDOFF.md, servizi.json e il codice dei mockup in design/ (HTML con template e logica demo: non si aprono da soli nel browser, leggili come riferimento di layout, testi, stili e comportamento).
Costruisci il sito Level Up seguendo le specifiche, in questo ordine, fermandoti dopo ogni fase per farmi provare:

1. Setup Next.js + TypeScript + Tailwind con i token di design (colori, font Gloock e Karla, angoli netti, animazioni con prefers-reduced-motion). Ricrea la Home identica al mockup, responsive fino a 375px, con banner cookie funzionante.
2. Database (Prisma + Postgres) con il modello del §5, seed da servizi.json, pagina Listino letta dal database.
3. Flusso di prenotazione: servizi, disponibilità calcolata sulle durate, scelta orario. Per ora login e WhatsApp simulati (codice stampato in console).
4. Login vero con OTP via WhatsApp Cloud API, sessione, area Account.
5. Stripe SetupIntent per la carta a garanzia, conferma prenotazione, pagina Termini.
6. Messaggi WhatsApp: conferma, promemoria 24h, lista d'attesa, richiamo 45 giorni (cron).
7. Admin mobile per Giulia (§8).
8. UTM, esportazione CSV mensile, test end-to-end del flusso completo.

Usa variabili d'ambiente per tutte le chiavi, crea un file .env.example, e scrivi test per il calcolo della disponibilità e dello sconto.

---
