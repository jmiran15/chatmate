/*
  Warnings:

  - The primary key for the `Embedding` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('BROAD', 'EXACT');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('GENERATIVE', 'STATIC');

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'QA';

-- DropIndex
DROP INDEX "Document_chatbotId_type_isPending_createdAt_updatedAt_idx";

-- DropIndex
DROP INDEX "Embedding_chatbotId_idx";

-- AlterTable
ALTER TABLE "Chatbot" ALTER COLUMN "responseLength" SET DEFAULT 'long';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "matchType" "MatchType" DEFAULT 'BROAD',
ADD COLUMN     "question" TEXT,
ADD COLUMN     "responseType" "ResponseType" DEFAULT 'GENERATIVE';

-- AlterTable
ALTER TABLE "Embedding" DROP CONSTRAINT "Embedding_pkey",
ADD COLUMN     "isQA" BOOLEAN DEFAULT false,
ADD CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id", "chatbotId");

-- CreateIndex
CREATE INDEX "Document_chatbotId_type_isPending_createdAt_updatedAt_quest_idx" ON "Document"("chatbotId", "type", "isPending", "createdAt", "updatedAt", "question", "matchType");

-- CreateIndex
CREATE INDEX "Embedding_documentId_isQA_idx" ON "Embedding"("documentId", "isQA");
