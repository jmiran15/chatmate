/*
  Warnings:

  - You are about to drop the column `elapsedNs` on the `Chat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chatId]` on the table `AnonymousUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatId` to the `AnonymousUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AnonymousUser_sessionId_key";

-- AlterTable
ALTER TABLE "AnonymousUser" ADD COLUMN     "chatId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "elapsedNs",
ADD COLUMN     "elapsedMs" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUser_chatId_key" ON "AnonymousUser"("chatId");

-- AddForeignKey
ALTER TABLE "AnonymousUser" ADD CONSTRAINT "AnonymousUser_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
