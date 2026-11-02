# Video del catalogo servizi (pagina /listino)

## Dove metterli

Nella cartella `public/videos/` del progetto. Per ogni servizio servono tre file con lo stesso nome:

| File | A cosa serve |
|---|---|
| `NOME.webm` | Video per Chrome, Firefox, Android (VP9, più leggero) |
| `NOME.mp4` | Video per iPhone e Safari (H.264) |
| `NOME.jpg` | Prima immagine, mostrata mentre il video carica |

`NOME` è quello indicato in `src/data/catalogo.ts` (campo `video`):

taglio-donna, taglio-uomo, piega, asciugatura, colore-ricrescita, colore-completo, tonalizzante,
permanente, airtouch, bodylights, meches, balayage, cheratina, trattamento-lunghezze,
trattamento-cute, rasatura-barba, modellatura-barba, sopracciglia

Esempio: `public/videos/balayage.webm`, `public/videos/balayage.mp4`, `public/videos/balayage.jpg`.

Se un file manca, il sito mostra il riquadro "Video in arrivo": si possono aggiungere un po' alla volta.

## Caratteristiche consigliate

- Formato verticale 4:5, per esempio 800 x 1000 pixel.
- Durata 3-6 secondi, pensati per girare in loop senza stacco visibile.
- Nessun audio (il sito li riproduce comunque muti).
- Peso: sotto 1,5 MB ciascuno.

Conversione con ffmpeg partendo da un file `originale.mov`:

```bash
ffmpeg -i originale.mov -an -vf "scale=800:1000:force_original_aspect_ratio=increase,crop=800:1000" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 balayage.webm
```

```bash
ffmpeg -i originale.mov -an -vf "scale=800:1000:force_original_aspect_ratio=increase,crop=800:1000" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart balayage.mp4
```

```bash
ffmpeg -i balayage.mp4 -frames:v 1 -q:v 3 balayage.jpg
```

## Video generati con l'IA: attenzione

- Per i video generati con l'IA metti `videoIA: true` in `src/data/catalogo.ts`: sotto il video
  compare "Video generato con l'intelligenza artificiale, a scopo illustrativo". Non toglierlo: un risultato simulato presentato come reale può essere pubblicità ingannevole
  (Codice del Consumo) e l'AI Act europeo chiede di dichiarare i contenuti sintetici.
- Il risultato mostrato deve essere realistico e ottenibile in salone.
- Se poi userete foto o video di clienti vere, serve la loro liberatoria scritta.
