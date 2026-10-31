# Level Up Pesaro: specifiche per lo sviluppo

Documento di passaggio dal design (cartella `design/`) al sito vero.
Da dare a Claude Code come contesto iniziale, insieme a `servizi.json`.

## 1. Obiettivo

Sito vetrina + prenotazione online per Level Up Hair Salon & Barber Shop
(Strada Adriatica 109, Pesaro). Una sola operatrice: Giulia.
Il sito mostra in breve valori, lavori e listino, poi porta a prenotare.

## 2. Stack consigliato

- Next.js (App Router) + TypeScript + Tailwind CSS
- Database Postgres (Supabase o Neon) con Prisma
- Hosting: Vercel
- Pagamenti: Stripe (solo carta a garanzia, vedi §6)
- Messaggi: WhatsApp Business Cloud API di Meta (OTP, conferme, promemoria, lista d'attesa)
- Cron: Vercel Cron per promemoria e richiami

## 3. Pagine

| Pagina | File di design | Note |
|---|---|---|
| Home | design/Main.dc.html | Barra promo, nav con Prenota + Accedi, hero, nastro servizi animato, valori, lavori, promo, listino, citazione, footer, banner cookie, WhatsApp flottante |
| Prenotazione | design/Booking.dc.html | Servizi (multi-selezione) → giorno e ora → accesso (solo se non loggato) → conferma con carta + termini → fatto |
| Account | design/Account.dc.html | Login con telefono, prossimo appuntamento (sposta / disdici), carnet, storico, riprenota |
| Legale | design/Legale.dc.html | Termini, Privacy, Cookie. BOZZA: da far verificare a un consulente |
| Admin (da creare) | nessuno | Vedi §8 |

I file `.dc.html` sono mockup HTML con template ({{...}}, sc-for, sc-if) e logica demo nella classe Component: non si aprono da soli nel browser. Usarli come riferimento di layout, testi, stili inline e comportamento, non come codice da copiare.

## 4. Design system

- Colori: fondo `#FCFFFF`, testo `#0E1A22`, testo secondario `#2C3B44` / `#4A5A63`, linee `#D6E2E7`, superficie tenue `#EEF6F9`, blu `#0593C6`, magenta `#D83995` (solo accenti grandi o linee; per testo piccolo magenta usare `#A31A6B`).
- Font: Gloock (titoli), Karla (testo). Google Fonts.
- Angoli netti (radius 0). Niente ombre, gradienti, icone decorative, emoji, trattini lunghi nei testi.
- Animazioni: entrata morbida dei blocchi, colore che oscilla tra blu e magenta su promo e accenti, nastro servizi scorrevole, transizioni colore sui pulsanti, skeleton durante il caricamento degli orari. Rispettare `prefers-reduced-motion`.
- Pulsante principale: fondo `#0E1A22`, testo `#FCFFFF`, hover fondo `#0593C6` testo `#0E1A22`.
- Contrasto minimo 4.5:1 sul testo normale. Target touch almeno 44px.

## 5. Modello dati (minimo)

- `Customer`: id, phone (E.164, unico), name, createdAt, marketingConsent (bool + data), stripeCustomerId, stripePaymentMethodId
- `Service`: id, section, name, price, priceFrom (bool), durationMin (MAI mostrato al cliente), promoEligible (bool), active
- `Booking`: id, customerId, start, end, status (confirmed / cancelled / no_show / completed), totalPrice, discount, source (utm), createdAt
- `BookingItem`: bookingId, serviceId, price
- `WaitlistEntry`: id, customerId, date, serviceIds, createdAt, notifiedAt, status
- `Block`: id, start, end, reason (pausa, ferie, appuntamento telefonico)
- `OtpCode`: phone, codeHash, expiresAt, attempts
- `Settings`: orari per giorno, slot (30 min), finestra disdetta gratuita (24h), sconto prima visita (20%), scadenza promo (2026-11-30), giorni richiamo (45), ritardo massimo (15 min)
- `PunchCard` (carnet): customerId, cuts (0-5), rewardsAvailable

## 6. Logiche chiave

### Accesso (senza email, senza password)
1. L'utente inserisce il cellulare (+39).
2. Il server genera un codice a 6 cifre, lo salva hashato con scadenza 10 minuti e massimo 5 tentativi, lo invia con un template WhatsApp di categoria "authentication".
3. Verifica → sessione con cookie httpOnly (es. 90 giorni).
4. Se il numero è nuovo, chiedere solo il nome.
5. Limitare le richieste di codice per numero e per IP.

Il login si chiede SOLO quando il cliente preme "Prenota" dopo aver scelto servizi e orario, oppure dal pulsante "Accedi" in alto. Mai all'ingresso.

### Disponibilità
- Durata prenotazione = somma `durationMin` dei servizi scelti, arrotondata a blocchi di 30 min.
- Uno slot è valido se tutti i blocchi necessari sono liberi e dentro la stessa fascia oraria (rispettare la pausa pranzo).
- Mostrare al cliente solo l'ora di inizio, mai la durata.
- Lock transazionale alla conferma per evitare doppie prenotazioni.

### Sconto prima visita
- 20% solo sui servizi `promoEligible` (taglio donna, taglio uomo, piega).
- Solo clienti senza prenotazioni precedenti completate, prenotazione creata entro il 30/11/2026.
- Sul sito si comunica "−20% sulla prima visita"; il dettaglio è nei Termini (§ Promozione) e lo sconto reale compare nel riepilogo prima della conferma. Verificare con un consulente che la comunicazione sia conforme al Codice del Consumo.

### Carta a garanzia (niente caparra)
- Stripe SetupIntent: si salva la carta, nessun addebito e nessun blocco di fondi.
- Una pre-autorizzazione classica scade in circa 7 giorni, quindi non va bene per prenotazioni lontane.
- In caso di no-show o disdetta nelle 24 ore: addebito off-session del valore del servizio, solo su azione manuale di Giulia dall'admin.
- Checkbox obbligatoria di accettazione dei Termini prima di confermare.

### WhatsApp
- Conferma prenotazione (template "utility").
- Promemoria 24 ore prima con risposte rapide: Confermo / Sposta / Disdici.
- Lista d'attesa: se si libera uno slot compatibile, avvisare in ordine di iscrizione; il primo che risponde lo prende; lo slot resta bloccato 15 minuti per ogni avviso.
- Richiamo clienti che non vengono da 45 giorni (solo con consenso marketing).
- Richiesta recensione Google dopo la visita (con consenso).
- Tutti i template vanno approvati da Meta; serve un numero dedicato al WhatsApp Business API.

### Cookie
- Banner all'ingresso con "Accetta" e "Rifiuta" di pari evidenza, link ai dettagli.
- Pixel Meta / Google Analytics caricati SOLO dopo "Accetta".
- Privacy e Termini non vanno accettati all'ingresso: si accettano nel flusso di prenotazione.

## 7. Tracciamento per il report mensile

- Parametri UTM su tutti i link di sponsorizzate, bio Instagram, TikTok, profilo Google.
- Salvare `source` su ogni prenotazione.
- Esportazione CSV mensile: nuovi clienti per fonte, prenotazioni online, disdette, no-show, slot recuperati dalla lista d'attesa. Le colonne corrispondono al file Excel di monitoraggio.

## 8. Admin per Giulia (mobile first)

- Agenda giornaliera e settimanale.
- Bloccare o sbloccare slot con un tocco (pausa, ferie, appuntamento preso al telefono).
- Inserire a mano una prenotazione telefonica.
- Segnare no-show e, se serve, addebitare la carta.
- Modificare listino, prezzi, durate, orari e impostazioni (§5 Settings).
- Vedere la lista d'attesa.
- Accesso: stesso login con telefono, ruolo admin.

## 9. Da raccogliere prima del lancio

- Foto vere (hero, 5 lavori, servizi).
- Conferma listino: "Totalizzante" o "Tonalizzante", Balayage 30 €, Colore completo 30 € e ricrescita 35 €, Sopracciglia.
- Ragione sociale, P.IVA, email di contatto.
- Citazione di Giulia con parole sue.
- Revisione legale di Termini, Privacy, Cookie.
- Account: Meta Business verificato + numero WhatsApp API, Stripe, dominio.
