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
      const data = Object.values(childrenValues)[0];

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

      const updatedChat = await prisma.chat.update({
        where: { id: job.data.chatId },
        data,
      });

      return updatedChat;
    },
  );

function isValidPartialChat(
  data: unknown,
): data is Partial<Prisma.ChatUpdateInput> {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const allowedKeys = Object.keys(prisma.chat.fields).filter(
    (key) => !["id", "createdAt", "updatedAt"].includes(key),
  );

  const isValid = Object.keys(data).every((key) => allowedKeys.includes(key));

  return isValid;
}
