-- AlterTable
ALTER TABLE "Chatbot" ADD COLUMN     "embeddedOn" TEXT,
ADD COLUMN     "installed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPingedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Chatbot_userId_createdAt_idx" ON "Chatbot"("userId", "createdAt" DESC);
