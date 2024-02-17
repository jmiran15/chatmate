import { type Chat, type Message } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
export type { Chat, Message } from "@prisma/client";

export function createChat({ chatbotId }: { chatbotId: Chat["chatbotId"] }) {
  return prisma.chat.create({
    data: {
      id: uuidv4(),
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
    },
  });
}

export async function createChatWithStarterMessages({
  chatbotId,
}: {
  chatbotId: Chat["chatbotId"];
}) {
  // fetch the chatbot by its id
  const chatbot = await prisma.chatbot.findUnique({
    where: {
      id: chatbotId,
    },
  });

  if (!chatbot) {
    throw new Error("Chatbot not found");
  }

  return prisma.chat.create({
    data: {
      id: uuidv4(),
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
      messages: {
        create: chatbot.introMessages.map((question) => ({
          role: "assistant",
          content: question,
        })),
      },
    },
  });
}

export async function createChatWithStartersAndUser({
  chatbotId,
  userId,
}: {
  chatbotId: Chat["chatbotId"];
  userId: string;
}) {
  const chat = await createChatWithStarterMessages({ chatbotId });

  return prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function createChatWithUser({
  chatbotId,
  userId,
}: {
  chatbotId: Chat["chatbotId"];
  userId: string;
}) {
  return prisma.chat.create({
    data: {
      id: uuidv4(),
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function getMessagesByChatId({ chatId }: { chatId: Chat["id"] }) {
  return prisma.message.findMany({
    where: {
      chatId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export function createMessage({
  chatId,
  role,
  content,
}: Pick<Message, "role" | "content"> & { chatId: Chat["id"] }) {
  return prisma.message.create({
    data: {
      role,
      content,
      chat: {
        connect: {
          id: chatId,
        },
      },
    },
  });
}

export function getChatsByUserAndChatbotId({
  userId,
  chatbotId,
}: {
  userId: string;
  chatbotId: string;
}) {
  return prisma.chat.findMany({
    where: {
      userId,
      chatbotId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export function deleteChatByChatId({ chatId }: { chatId: Chat["id"] }) {
  return prisma.chat.delete({
    where: {
      id: chatId,
    },
  });
}

export function updateChatName({
  chatId,
  chatName,
}: {
  chatId: Chat["id"];
  chatName: Chat["name"];
}) {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      name: chatName,
    },
  });
}

export function getChatById({ chatId }: { chatId: Chat["id"] }) {
  return prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });
}
