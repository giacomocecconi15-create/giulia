# Linee Guida di Ottimizzazione AI (GEO) per Claude Code

Fornisci questo documento a Claude o usalo come prompt di sistema durante la generazione del codice per assicurarti che il sito web sia ottimizzato per i motori di ricerca basati su Intelligenza Artificiale (ChatGPT, Perplexity, Gemini, ecc.).

## 1. Dati Strutturati Obbligatori (JSON-LD)
I modelli LLM si affidano ai dati strutturati per estrarre fatti certi senza dover interpretare il testo.
*   **Regola per Claude:** "Per ogni pagina generata, devi includere nel `<head>` uno script `application/ld+json` valido secondo Schema.org."
*   **Entità da coprire:** 
    *   `LocalBusiness` / `Organization` (Nome, indirizzo, telefono, orari di apertura).
    *   `Product` / `Offer` (Prezzo, valuta, disponibilità in magazzino).
    *   `FAQPage` (Per tutte le sezioni di domande e risposte).

## 2. Struttura HTML Semantica Rigorosa
I parser delle IA analizzano il DOM per pesare l'importanza delle informazioni.
*   **Regola per Claude:** "Scrivi HTML5 semanticamente puro. Vieta l'uso eccessivo di `<div>` (div-soup). Il contenuto principale deve essere racchiuso in `<main>`."
*   **Gerarchia:** Usa i tag `<article>`, `<section>`, `<aside>`, `<nav>`. Mantenere una gerarchia di intestazioni ininterrotta (`<h1>` unico per il titolo principale, seguito da `<h2>`, poi `<h3>`).

## 3. Direttive per Crawler IA (robots.txt)
Se i bot delle IA non possono leggere il sito, non potranno raccomandarlo.
*   **Regola per Claude:** "Genera un file `robots.txt` che permetta esplicitamente il crawling ai principali bot di intelligenza artificiale."
*   **Codice da includere:**
    ```text
    User-agent: GPTBot
    Allow: /
    User-agent: CCBot
    Allow: /
    User-agent: Claude-Web
    Allow: /
    User-agent: Google-Extended
    Allow: /
    ```

## 4. Formattazione RAG (Retrieval-Augmented Generation)
Le IA estraggono "chunk" (frammenti) di testo per generare le risposte. Testi troppo densi vengono spesso ignorati.
*   **Regola per Claude:** "Formatta le informazioni chiave (funzionalità, prezzi, confronti) utilizzando elenchi puntati (`<ul>`), elenchi numerati (`<ol>`) e tabelle (`<table>`)."
*   **Micro-paragrafi:** Mantieni i paragrafi sotto le 3-4 frasi. Usa il grassetto (`<strong>`) per evidenziare le entità o i concetti chiave.

## 5. Sezione FAQ Conversazionale
Le IA adorano i siti che rispondono direttamente alle domande degli utenti.
*   **Regola per Claude:** "Includi una sezione FAQ nelle pagine principali o di prodotto. Le domande devono essere formulate in linguaggio naturale (es. 'Come funziona...', 'Quanto costa...'), esattamente come un utente scriverebbe un prompt."
*   **Markup:** Questa sezione deve essere visibile in HTML e replicata nel JSON-LD come `FAQPage`.

## 6. Accessibilità e Contesto (Testi Alt)
Le IA multimodali e i parser leggono i metadati delle risorse visive.
*   **Regola per Claude:** "Ogni tag `<img>` deve avere un attributo `alt` descrittivo e contestuale. Se l'immagine è un grafico o mostra dati, l'attributo alt deve riassumere i dati stessi."