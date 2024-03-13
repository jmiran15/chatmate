import { type Chat, type Message } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
import { generateChatName, generateChatSummary } from "~/utils/openai";
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

export function createChatWithId({
  chatId,
  chatbotId,
}: {
  chatId: Chat["id"];
  chatbotId: Chat["chatbotId"];
}) {
  return prisma.chat.create({
    data: {
      id: chatId,
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
    },
  });
}

export async function createChatWithStarterMessages({
  sessionId,
  chatbotId,
}: {
  sessionId: Chat["id"];
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
      id: sessionId,
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

export function getChatsByChatbotId({
  chatbotId, // userId,
}: {
  chatbotId: Chat["chatbotId"];
  // userId: string;
}) {
  return prisma.chat.findMany({
    where: {
      chatbotId,
      userId: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function updateChatNameWithAI({ chatId }: { chatId: Chat["id"] }) {
  // get the chat messages
  const messages = await getMessagesByChatId({ chatId });
  const formattedMessages = messages.map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content,
  }));

  // generate a name for the chat
  const newName = await generateChatName(formattedMessages);

  if (!newName.chatName) {
    throw new Error("Failed to generate a name for the chat");
  }

  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      name: newName.chatName,
    },
  });
}

export async function updateChatAIInsights({ chatId }: { chatId: Chat["id"] }) {
  // get the chat messages
  const messages = await getMessagesByChatId({ chatId });
  const formattedMessages = messages.map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content,
  }));

  // generate a name for the chat
  const insights = await generateChatSummary(formattedMessages);

  if (!insights.chatSummary) {
    throw new Error("Failed to generate insights for the chat");
  }

  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      aiInsights: insights.chatSummary,
    },
  });
}

export function clearChatMessages({ chatId }: { chatId: Chat["id"] }) {
  return prisma.message.deleteMany({
    where: {
      chatId,
    },
  });
}

export function getPublicChatsCount({
  chatbotId,
}: {
  chatbotId: Chat["chatbotId"];
}) {
  return prisma.chat.count({
    where: {
      chatbotId,
      userId: null,
    },
  });
}

// pagination
export async function getChatsPagination({
  chatbotId,
  cursorId,
  take,
  starred,
  sort,
}: {
  chatbotId: Chat["chatbotId"];
  cursorId: Chat["id"] | null;
  take: number;
  starred?: boolean;
  sort: "dateNewToOld" | "dateOldToNew";
}) {
  const where = starred
    ? {
        chatbotId,
        userId: null,
        starred: true,
      }
    : {
        chatbotId,
        userId: null,
      };

  const include = {
    _count: {
      select: { messages: true },
    },
  };

  const orderBy =
    sort === "dateNewToOld"
      ? {
          createdAt: "desc",
        }
      : {
          createdAt: "asc",
        };

  let queryResults = [];

  if (!cursorId) {
    // first take
    queryResults = await prisma.chat.findMany({
      take,
      where,
      orderBy,
      include,
    });
  } else {
    queryResults = await prisma.chat.findMany({
      take,
      skip: 1, // Skip the cursor
      cursor: {
        id: cursorId,
      },
      where,
      orderBy,
      include,
    });
  }

  if (queryResults.length === 0) {
    return {
      chats: [],
      cursorId,
    };
  }

  const lastChatInResults = queryResults[queryResults.length - 1];
  const cursor = lastChatInResults.id;
  return {
    chats: queryResults,
    cursorId: cursor,
  };
}

export function updateChatStarredStatus({
  chatId,
  starred,
}: {
  chatId: Chat["id"];
  starred: boolean;
}) {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      starred,
    },
  });
}
