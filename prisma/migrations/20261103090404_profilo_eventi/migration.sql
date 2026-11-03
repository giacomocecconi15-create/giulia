-- CreateEnum
CREATE TYPE "HairType" AS ENUM ('lisci', 'mossi', 'ricci', 'afro');

-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('under18', 'r18_24', 'r25_34', 'r35_44', 'r45_54', 'r55_64', 'r65plus');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "ageRange" "AgeRange",
ADD COLUMN     "bio" VARCHAR(280),
ADD COLUMN     "hairType" "HairType",
ADD COLUMN     "profileUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ref" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_type_createdAt_idx" ON "Event"("type", "createdAt");
