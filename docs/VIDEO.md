# Video del catalogo servizi (pagina /listino)

## Dove metterli

Nella cartella `public/videos/` del progetto. Per ogni servizio servono due file con lo stesso nome:

| File | A cosa serve |
|---|---|
| `NOME.mp4` | Video con audio (H.264 + AAC), funziona su tutti i browser, iPhone compreso |
| `NOME.jpg` | Prima immagine, mostrata mentre il video carica |

Il video parte con l'audio quando il cliente clicca il servizio (i browser non permettono l'audio senza un click).

`NOME` è quello indicato in `src/data/catalogo.ts` (campo `video`):

taglio-donna, taglio-uomo, piega, asciugatura, colore-ricrescita, colore-uomo (usato da Colore completo), tonalizzante,
permanente, airtouch, bodylights, meches, balayage, cheratina, trattamento-lunghezze,
trattamento-cute, rasatura-barba, modellatura-barba, sopracciglia

Esempio: `public/videos/balayage.webm`, `public/videos/balayage.mp4`, `public/videos/balayage.jpg`.

Se un file manca, il sito mostra il riquadro "Video in arrivo": si possono aggiungere un po' alla volta.

## Caratteristiche consigliate

- Formato verticale 4:5, per esempio 800 x 1000 pixel.
- Durata 3-6 secondi, pensati per girare in loop senza stacco visibile.
- Audio: musica con licenza per uso commerciale sul web (vedi sotto). Volume normalizzato.
- Peso: sotto 1,5 MB ciascuno.

Conversione con ffmpeg partendo da un file `originale.mov`:

```bash
ffmpeg -i originale.mov -vf "scale=720:900:force_original_aspect_ratio=increase,crop=720:900,fps=30" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart balayage.mp4
```

```bash
ffmpeg -i balayage.mp4 -frames:v 1 -q:v 3 balayage.jpg
```

## Musica: attenzione

La musica dei reel di Instagram (libreria audio di Meta) ha la licenza solo per Instagram e Facebook.
Sul sito serve musica senza diritti o con licenza commerciale (per esempio Pixabay Music,
YouTube Audio Library con licenza che lo consente, Epidemic Sound, Artlist), oppure nessuna musica.

## Video generati con l'IA: attenzione

- Per i video generati con l'IA metti `videoIA: true` in `src/data/catalogo.ts`: sotto il video
  compare "Video generato con l'intelligenza artificiale, a scopo illustrativo". Non toglierlo: un risultato simulato presentato come reale può essere pubblicità ingannevole
  (Codice del Consumo) e l'AI Act europeo chiede di dichiarare i contenuti sintetici.
- Il risultato mostrato deve essere realistico e ottenibile in salone.
- Se poi userete foto o video di clienti vere, serve la loro liberatoria scritta.
