-- CreateIndex
CREATE INDEX "AnonymousUser_chatId_idx" ON "AnonymousUser"("chatId");

-- CreateIndex
CREATE INDEX "Chat_chatbotId_deleted_createdAt_idx" ON "Chat"("chatbotId", "deleted", "createdAt");

-- CreateIndex
CREATE INDEX "Message_chatId_role_idx" ON "Message"("chatId", "role");
