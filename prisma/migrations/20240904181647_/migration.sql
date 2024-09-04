/*
  Warnings:

  - You are about to drop the column `seen` on the `Message` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('REQUESTED_LIVE_CHAT', 'AGENT_JOINED', 'AGENT_LEFT');

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "seen",
ADD COLUMN     "activity" "ActivityType",
ADD COLUMN     "seenByAgent" BOOLEAN DEFAULT false,
ADD COLUMN     "seenByUser" BOOLEAN DEFAULT false,
ADD COLUMN     "seenByUserAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ToolCall" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" TEXT,

    CONSTRAINT "ToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolFunction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "arguments" TEXT,
    "toolCallId" TEXT NOT NULL,

    CONSTRAINT "ToolFunction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ToolFunction_toolCallId_key" ON "ToolFunction"("toolCallId");

-- AddForeignKey
ALTER TABLE "ToolCall" ADD CONSTRAINT "ToolCall_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolFunction" ADD CONSTRAINT "ToolFunction_toolCallId_fkey" FOREIGN KEY ("toolCallId") REFERENCES "ToolCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
