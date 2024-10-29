// get chat

import { prisma } from "~/db.server";
import { Queue } from "~/utils/queue.server";

export interface GetChat {
  chatId: string;
}

export const getChat = Queue<GetChat>("getChat", async (job) => {
  const chat = await prisma.chat.findUnique({
    where: { id: job.data.chatId },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          content: true,
          id: true,
        },
        take: 10,
      },
    },
  });

  return chat;
});
