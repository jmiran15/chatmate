// update a field in the chat
import type { Prisma } from "@prisma/client";

import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";

export interface UpdateChatFromChildrenQueueData {
  chatId: string;
}

export const updateChatFromChildrenQueue =
  Queue<UpdateChatFromChildrenQueueData>(
    "updateChatFromChildren",
    async (job) => {
      const childrenValues = await job.getChildrenValues();

      if (Object.keys(childrenValues).length === 0) {
        console.warn(`No child values found for chat update job ${job.id}`);
        return null; // Or handle this case as appropriate for your application
      }

      const data = Object.values(childrenValues)[0];

      if (!data) {
        console.error(`No valid data found in child values for job ${job.id}`);
        throw new Error(`No valid data found in child values for chat update`);
      }

      if (!isValidPartialChat(data)) {
        console.error(`Invalid data format for chat update`);
        throw new Error(
          `Invalid data format for chat update: ${JSON.stringify(
            data,
            null,
            2,
          )}`,
        );
      }

      try {
        const updatedChat = await prisma.chat.update({
          where: { id: job.data.chatId },
          data,
        });
        return updatedChat;
      } catch (error) {
        console.error(`Error updating chat ${job.data.chatId}:`, error);
        throw new Error(`Failed to update chat: ${error}`);
      }
    },
  );

function isValidPartialChat(
  data: unknown,
): data is Partial<Prisma.ChatUpdateInput> {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const dataKeys = Object.keys(data);
  if (dataKeys.length === 0) {
    return false; // Reject empty objects
  }

  const allowedKeys = Object.keys(prisma.chat.fields).filter(
    (key) => !["id", "createdAt", "updatedAt"].includes(key),
  );

  const isValid = dataKeys.every((key) => allowedKeys.includes(key));

  return isValid;
}
