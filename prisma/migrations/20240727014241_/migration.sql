/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `AnonymousUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AnonymousUser_sessionId_key" ON "AnonymousUser"("sessionId");
