-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "durationMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "heldEnd" TIMESTAMP(3);
