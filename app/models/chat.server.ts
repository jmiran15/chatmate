import { type Chat } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
import { createAnonymousChat } from "~/routes/api.chat.$chatbotId.$sessionId/queries.server";
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
  sId,
}: {
  sessionId: Chat["id"];
  chatbotId: Chat["chatbotId"];
  sId?: Chat["sessionId"];
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
      sessionId: sId,
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
  const chat = await createAnonymousChat({ chatbotId });

  if (!chat) {
    throw new Error("Failed to create chat");
  }

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

// unseen assistant/agent messages, not seenByUser
export async function getMessagesAndUnseenCount({
  chatId,
}: {
  chatId: Chat["id"];
}) {
  const [allMessages, unseenMessagesCount] = await prisma.$transaction([
    prisma.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.message.count({
      where: {
        chatId,
        seenByUser: false,
        role: "assistant", // we only care about non user messages for now
      },
    }),
  ]);
  return {
    allMessages,
    unseenMessagesCount,
  };
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
    include: {
      labels: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });
}

// get chat by sessionId, return the latest one
export function getChatBySessionId({
  sessionId,
}: {
  sessionId: Chat["sessionId"];
}) {
  return prisma.chat.findFirst({
    where: {
      sessionId: sessionId,
    },
    orderBy: {
      updatedAt: "desc",
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

// get first public chat
export function getFirstPublicChat({
  chatbotId,
}: {
  chatbotId: Chat["chatbotId"];
}) {
  return prisma.chat.findFirst({
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
