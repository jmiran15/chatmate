/*
  Warnings:

  - You are about to drop the column `description` on the `Chatbot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chatbot" DROP COLUMN "description",
ADD COLUMN     "model" TEXT DEFAULT 'gpt-3.5-turbo-0125',
ADD COLUMN     "responseLength" TEXT DEFAULT 'short',
ADD COLUMN     "systemPrompt" TEXT;
