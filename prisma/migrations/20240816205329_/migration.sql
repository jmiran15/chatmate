-- CreateEnum
CREATE TYPE "WidgetPosition" AS ENUM ('BOTTOM_RIGHT', 'BOTTOM_LEFT');

-- AlterTable
ALTER TABLE "Chatbot" ADD COLUMN     "widgetPosition" "WidgetPosition" DEFAULT 'BOTTOM_RIGHT';

-- CreateIndex
CREATE INDEX "Document_chatbotId_type_isPending_createdAt_updatedAt_idx" ON "Document"("chatbotId", "type", "isPending", "createdAt", "updatedAt");
