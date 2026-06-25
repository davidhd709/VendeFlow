-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "activationDate" TIMESTAMP(3),
ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" TEXT;
