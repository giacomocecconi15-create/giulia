export const hairTypes = [
  { id: "lisci", label: "Lisci" },
  { id: "mossi", label: "Mossi" },
  { id: "ricci", label: "Ricci" },
  { id: "afro", label: "Afro" },
] as const;

export const ageRanges = [
  { id: "under18", label: "Meno di 18" },
  { id: "r18_24", label: "18-24" },
  { id: "r25_34", label: "25-34" },
  { id: "r35_44", label: "35-44" },
  { id: "r45_54", label: "45-54" },
  { id: "r55_64", label: "55-64" },
  { id: "r65plus", label: "65 e più" },
] as const;

export type HairTypeId = (typeof hairTypes)[number]["id"];
export type AgeRangeId = (typeof ageRanges)[number]["id"];

export const BIO_MAX = 280;

export const labelHair = (id?: string | null) => hairTypes.find((h) => h.id === id)?.label ?? null;
export const labelAge = (id?: string | null) => ageRanges.find((a) => a.id === id)?.label ?? null;

/** Valida i dati del profilo; i campi vuoti diventano null. */
export function parseProfile(input: { bio?: unknown; ageRange?: unknown; hairType?: unknown }) {
  const bio = typeof input.bio === "string" ? input.bio.replace(/\s+/g, " ").trim().slice(0, BIO_MAX) || null : null;
  const ageRange = ageRanges.some((a) => a.id === input.ageRange) ? (input.ageRange as AgeRangeId) : null;
  const hairType = hairTypes.some((h) => h.id === input.hairType) ? (input.hairType as HairTypeId) : null;
  return { bio, ageRange, hairType };
}
