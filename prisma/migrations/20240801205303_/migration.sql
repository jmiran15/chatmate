/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `AnonymousUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "AnonymousUser" ADD COLUMN     "chatId" TEXT;

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "elapsedMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "status" "TicketStatus" DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "Chatbot" ADD COLUMN     "embeddedOn" TEXT,
ADD COLUMN     "installed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPingedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "clusterId" TEXT;

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commonChatbotId" TEXT NOT NULL,
    "gapChatbotId" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ffffff',
    "chatbotId" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatToLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChatToLabel_AB_unique" ON "_ChatToLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatToLabel_B_index" ON "_ChatToLabel"("B");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUser_chatId_key" ON "AnonymousUser"("chatId");

-- CreateIndex
CREATE INDEX "AnonymousUser_chatId_idx" ON "AnonymousUser"("chatId");

-- CreateIndex
CREATE INDEX "Chat_chatbotId_deleted_createdAt_idx" ON "Chat"("chatbotId", "deleted", "createdAt");

-- CreateIndex
CREATE INDEX "Chatbot_userId_createdAt_idx" ON "Chatbot"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Message_chatId_role_idx" ON "Message"("chatId", "role");

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_commonChatbotId_fkey" FOREIGN KEY ("commonChatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_gapChatbotId_fkey" FOREIGN KEY ("gapChatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousUser" ADD CONSTRAINT "AnonymousUser_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToLabel" ADD CONSTRAINT "_ChatToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToLabel" ADD CONSTRAINT "_ChatToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
