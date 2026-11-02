import type { Prisma } from "@prisma/client";

/** Servizi di una prenotazione sempre nell'ordine del listino (sezione, poi posizione). */
export const ITEMS_ORDER: Prisma.BookingItemOrderByWithRelationInput[] = [
  { service: { section: { sortOrder: "asc" } } },
  { service: { sortOrder: "asc" } },
];
