/*
  Warnings:

  - You are about to drop the column `bio` on the `Chatbot` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Chatbot` table. All the data in the column will be lost.
  - You are about to drop the column `starterQuestions` on the `Chatbot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "starred" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Chatbot" DROP COLUMN "bio",
DROP COLUMN "color",
DROP COLUMN "starterQuestions",
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "openIcon" TEXT NOT NULL DEFAULT 'plus',
ADD COLUMN     "themeColor" TEXT NOT NULL DEFAULT 'zinc';
