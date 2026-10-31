/**
 * Seed: listino da src/data/servizi.json e impostazioni di default.
 * Idempotente: si può rilanciare, aggiorna i servizi esistenti.
 *   npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import data from "../src/data/servizi.json";
import { defaultOpeningHours, promo } from "../src/lib/site";

const prisma = new PrismaClient();

type ServizioJson = {
  id: string;
  nome: string;
  prezzo: number;
  prezzoMax?: number;
  prezzoDa?: boolean;
  durationMin: number;
  promoEligible: boolean;
  daVerificare?: string;
};

async function main() {
  for (const [i, sezione] of data.sezioni.entries()) {
    await prisma.serviceSection.upsert({
      where: { id: sezione.id },
      update: { name: sezione.nome, sortOrder: i },
      create: { id: sezione.id, name: sezione.nome, sortOrder: i },
    });

    for (const [j, s] of (sezione.servizi as ServizioJson[]).entries()) {
      const fields = {
        sectionId: sezione.id,
        name: s.nome,
        priceCents: Math.round(s.prezzo * 100),
        priceMaxCents: s.prezzoMax != null ? Math.round(s.prezzoMax * 100) : null,
        priceFrom: s.prezzoDa ?? false,
        durationMin: s.durationMin,
        promoEligible: s.promoEligible,
        sortOrder: j,
        internalNote: s.daVerificare ?? null,
      };
      await prisma.service.upsert({ where: { id: s.id }, update: fields, create: { id: s.id, ...fields } });
    }
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      openingHours: defaultOpeningHours,
      promoEndDate: new Date(`${promo.endDate}T00:00:00Z`),
      firstVisitDiscountPct: promo.discountPercent,
    },
  });

  const adminPhone = process.env.ADMIN_PHONE;
  if (adminPhone) {
    await prisma.customer.upsert({
      where: { phone: adminPhone },
      update: { role: "admin" },
      create: { phone: adminPhone, name: "Giulia", role: "admin" },
    });
  }

  const n = await prisma.service.count();
  console.log(`Seed completato: ${n} servizi, impostazioni pronte${adminPhone ? ", admin creato" : ""}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
