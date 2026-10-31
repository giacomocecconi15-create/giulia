-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "customerConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "lateCancellation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "lastRecallAt" TIMESTAMP(3);
