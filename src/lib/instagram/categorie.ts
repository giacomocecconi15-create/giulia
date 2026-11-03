/** Categorie della Galleria, nell'ordine dei filtri. */
export const categorieGalleria = [
  { id: "donna", label: "Taglio e piega" },
  { id: "colore", label: "Colore" },
  { id: "schiariture", label: "Schiariture" },
  { id: "uomo", label: "Uomo e barba" },
  { id: "sposa", label: "Sposa" },
  { id: "trattamenti", label: "Trattamenti" },
] as const;

export type CategoriaGalleria = (typeof categorieGalleria)[number]["id"];

/** Regole in ordine di priorità: la prima che corrisponde vince. */
const regole: [CategoriaGalleria, RegExp][] = [
  ["sposa", /\b(spos[ae]|bride|bridal|wedding|matrimoni|raccolt[oi]|acconciatur[ae]|cerimonia)/i],
  ["trattamenti", /\b(cheratin|trattament|ricostruz|botox|keratin|cute)/i],
  ["schiariture", /\b(balayage|airtouch|air touch|bodylights?|m[eè]ches|schiarit|degrad[eè]|shatush|biond|platin)/i],
  ["colore", /\b(color[ei]|tinta|ricrescita|tonalizz|riflessi|copertura)/i],
  ["uomo", /\b(uomo|uomini|barber|barba|beard|fade|sfumat|men)\b/i],
  ["donna", /\b(taglio|piega|bob|caschetto|onde|frangia|scalat)/i],
];

/**
 * Categoria di un post dalla didascalia. Si può forzare con un hashtag
 * #lu_<categoria> (es. #lu_sposa). Senza corrispondenze: "donna".
 */
export function categoriaDaDidascalia(caption: string | null | undefined): CategoriaGalleria {
  const text = caption ?? "";
  const forced = text.match(/#lu_(donna|colore|schiariture|uomo|sposa|trattamenti)\b/i);
  if (forced) return forced[1].toLowerCase() as CategoriaGalleria;
  for (const [cat, re] of regole) if (re.test(text)) return cat;
  return "donna";
}

/** Testo alternativo leggibile dalla didascalia (senza hashtag, emoji e menzioni). */
export function altDaDidascalia(caption: string | null | undefined, categoria: CategoriaGalleria): string {
  const label = categorieGalleria.find((c) => c.id === categoria)!.label;
  const clean = (caption ?? "")
    .replace(/[#@][\p{L}\p{N}_.]+/gu, "")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const first = clean.split(/(?<=[.!?])\s/)[0]?.slice(0, 120) ?? "";
  return first ? `${label}: ${first}` : `${label}, lavoro di Level Up Pesaro`;
}
