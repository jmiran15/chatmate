/*
  Warnings:

  - You are about to drop the column `responseType` on the `Embedding` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Embedding_documentId_isQA_responseType_idx";

-- AlterTable
ALTER TABLE "Embedding" DROP COLUMN "responseType";

-- CreateIndex
CREATE INDEX "Embedding_documentId_isQA_idx" ON "Embedding"("documentId", "isQA");
