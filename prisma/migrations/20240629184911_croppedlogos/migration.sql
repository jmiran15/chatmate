/*
  Warnings:

  - You are about to drop the column `logoUrl` on the `Chatbot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chatbot" DROP COLUMN "logoUrl",
ADD COLUMN     "croppedLogoFilepath" TEXT,
ADD COLUMN     "lastCrop" JSONB,
ADD COLUMN     "originalLogoFilepath" TEXT;
