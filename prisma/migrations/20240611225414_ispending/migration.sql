/*
  Warnings:

  - You are about to drop the column `ingestionProgress` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "ingestionProgress",
ADD COLUMN     "isPending" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "content" DROP NOT NULL;

-- DropEnum
DROP TYPE "IngestionProgress";
