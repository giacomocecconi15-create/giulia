/**
 * Catalogo animato del listino: categoria, descrizione e video per servizio.
 * I video vanno in public/videos/ con il nome indicato (vedi public/videos/LEGGIMI.md).
 * Un servizio senza video mostra un riquadro "video in arrivo".
 */

export type Categoria = "donna" | "uomo" | "trattamenti";

export const categorie: { id: Categoria | "tutti"; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "donna", label: "Donna" },
  { id: "uomo", label: "Uomo" },
  { id: "trattamenti", label: "Trattamenti" },
];

export type VoceCatalogo = {
  categorie: Categoria[];
  descrizione: string;
  /** Nome base del file in public/videos/ (senza estensione) */
  video?: string;
  /** true se il video è generato con l'IA: mostra la dichiarazione obbligatoria */
  videoIA?: boolean;
  /** Foto vera in public/images/, mostrata se il video manca */
  immagine?: { src: string; alt: string };
};

export const catalogo: Record<string, VoceCatalogo> = {
  "taglio-donna": { categorie: ["donna"], descrizione: "Taglio su misura del viso e del tipo di capello, con consulenza prima di iniziare.", video: "taglio-donna" },
  "taglio-uomo": {
    categorie: ["uomo"],
    descrizione: "Classico o sfumato, rifinito a forbice e macchinetta.",
    video: "taglio-uomo",
    immagine: { src: "/images/lavoro-taglio-uomo.jpg", alt: "Uomo di profilo con taglio corto sfumato ai lati" },
  },
  piega: {
    categorie: ["donna"],
    descrizione: "Liscia, mossa o voluminosa, pensata per durare.",
    video: "piega",
    immagine: { src: "/images/lavoro-sposa-onde.jpg", alt: "Piega a onde morbide su capelli lunghi castani" },
  },
  asciugatura: { categorie: ["donna", "uomo"], descrizione: "Asciugatura veloce dopo il lavaggio, senza messa in piega.", video: "asciugatura" },
  "colore-ricrescita": { categorie: ["donna", "uomo"], descrizione: "Colore solo sulla ricrescita, uniforme con le lunghezze.", video: "colore-ricrescita" },
  "colore-completo": {
    categorie: ["donna", "uomo"],
    descrizione: "Colore pieno dalla radice alle punte, per donna e uomo, fino al biondo platino con tonalizzazione finale.",
    video: "colore-uomo",
  },
  tonalizzante: { categorie: ["donna", "uomo"], descrizione: "Ravviva il riflesso e neutralizza i toni indesiderati dopo la schiaritura.", video: "tonalizzante" },
  permanente: { categorie: ["donna"], descrizione: "Onde e ricci che durano mesi, calibrati sulla tua lunghezza.", video: "permanente" },
  airtouch: { categorie: ["donna"], descrizione: "Schiaritura sfumata e naturale, senza stacchi, che cresce bene.", video: "airtouch" },
  bodylights: { categorie: ["donna"], descrizione: "Luci diffuse su tutta la chioma per un effetto luminoso.", video: "bodylights" },
  meches: { categorie: ["donna"], descrizione: "Ciocche schiarite definite, dal classico al contrasto deciso.", video: "meches" },
  balayage: {
    categorie: ["donna"],
    descrizione: "Schiaritura a mano libera sulle lunghezze, effetto sole.",
    video: "balayage",
    immagine: { src: "/images/lavoro-balayage.jpg", alt: "Balayage caramello su capelli lunghi mossi, visti da dietro" },
  },
  cheratina: { categorie: ["trattamenti", "donna"], descrizione: "Lisciante alla cheratina: capelli disciplinati e lucidi per settimane.", video: "cheratina" },
  "trattamento-lunghezze": { categorie: ["trattamenti"], descrizione: "Nutrimento e ristrutturazione per lunghezze secche o danneggiate.", video: "trattamento-lunghezze" },
  "trattamento-cute": { categorie: ["trattamenti"], descrizione: "Trattamento mirato per cute grassa, secca o sensibile.", video: "trattamento-cute" },
  "rasatura-barba": { categorie: ["uomo"], descrizione: "Rasatura completa con panno caldo e rifinitura.", video: "rasatura-barba" },
  "modellatura-barba": { categorie: ["uomo"], descrizione: "Forma e contorni della barba definiti, lunghezza a scelta.", video: "modellatura-barba" },
  sopracciglia: { categorie: ["donna", "uomo"], descrizione: "Pulizia e definizione delle sopracciglia.", video: "sopracciglia" },
};

/** Categoria di ripiego per servizi aggiunti dall'admin e non presenti qui sopra. */
export function categorieDaSezione(sectionId: string): Categoria[] {
  if (sectionId === "barba") return ["uomo"];
  if (sectionId === "colore") return ["donna", "uomo"];
  if (sectionId === "trattamenti") return ["trattamenti"];
  return ["donna"];
}
