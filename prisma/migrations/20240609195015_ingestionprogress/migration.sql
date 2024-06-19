-- CreateEnum
CREATE TYPE "IngestionProgress" AS ENUM ('PENDING', 'COMPLETE');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "ingestionProgress" "IngestionProgress" NOT NULL DEFAULT 'PENDING';
