import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { defaultOpeningHours, promo } from "../src/lib/site";

export const ADMIN_PHONE = "+393470000099";

export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.E2E !== "1" || !/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error("Test e2e: imposta E2E=1 e usa un DATABASE_URL locale (il setup svuota le prenotazioni).");
  }
  const db = new PrismaClient();
  await db.$transaction([
    db.otpCode.deleteMany(),
    db.waitlistEntry.deleteMany(),
    db.bookingItem.deleteMany(),
    db.booking.deleteMany(),
    db.block.deleteMany(),
    db.punchCard.deleteMany(),
    db.customer.deleteMany(),
  ]);
  await db.customer.create({ data: { phone: ADMIN_PHONE, name: "Giulia", role: "admin" } });
  // Listino e impostazioni di partenza
  execSync("npx tsx prisma/seed.ts --aggiorna", { stdio: "inherit" });
  await db.settings.update({
    where: { id: 1 },
    data: {
      openingHours: defaultOpeningHours,
      firstVisitDiscountPct: promo.discountPercent,
      promoEndDate: new Date(`${promo.endDate}T00:00:00Z`),
      freeCancellationHours: 24,
      minLeadMinutes: 60,
      bookingHorizonDays: 60,
    },
  });
  await db.$disconnect();
}
