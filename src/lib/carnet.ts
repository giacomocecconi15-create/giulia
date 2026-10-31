import type { Prisma } from "@prisma/client";

/** Ogni 5 tagli completati il cliente ottiene un premio. */
export const CUTS_FOR_REWARD = 5;
/** Premio del carnet: DA CONFERMARE con Giulia. */
export const REWARD_LABEL = "un taglio in omaggio";

export const isCut = (serviceId: string) => serviceId.startsWith("taglio-");

/** Aggiorna il carnet quando una visita con un taglio viene segnata come completata. */
export async function registerCompletedVisit(tx: Prisma.TransactionClient, customerId: string, serviceIds: string[]) {
  if (!serviceIds.some(isCut)) return;
  const card = await tx.punchCard.upsert({ where: { customerId }, update: {}, create: { customerId } });
  const cuts = card.cuts + 1;
  await tx.punchCard.update({
    where: { customerId },
    data: cuts >= CUTS_FOR_REWARD ? { cuts: 0, rewardsAvailable: { increment: 1 } } : { cuts },
  });
}
