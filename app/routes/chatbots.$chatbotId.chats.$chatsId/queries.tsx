import { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getChatInfo(chatId: string) {
  return prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      chatbot: {
        include: {
          labels: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
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

export async function deleteChat({
  chatId,
  chatbotId,
  starredQuery,
  createdAtQuery,
}: {
  chatId: string;
  chatbotId: string;
  starredQuery: { starred: boolean } | { starred?: undefined };
  createdAtQuery: {
    createdAt: Prisma.SortOrder;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const WHERE = {
      chatbotId,
      ...starredQuery,
      userId: null,
      deleted: false,
      messages: {
        some: {
          role: "user",
        },
      },
    };

    const [nextChat] = await Promise.all([
      tx.chat.findFirst({
        where: WHERE,
        cursor: { id: chatId },
        skip: 1,
        orderBy: createdAtQuery,
        select: { id: true },
      }),
      tx.chat.update({
        where: { id: chatId },
        data: { deleted: true },
      }),
    ]);

    return nextChat?.id ?? null;
  });
}

export async function markChatAsSeen(chatId: string) {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      seen: true,
    },
  });
}

export async function createLabel(name: string, chatbotId: string) {
  return prisma.label.create({
    data: {
      name,
      chatbotId,
    },
  });
}

export async function updateLabel(
  labelId: string,
  name: string,
  color: string,
) {
  return prisma.label.update({
    where: {
      id: labelId,
    },
    data: {
      name,
      color,
    },
  });
}

export async function deleteLabel(labelId: string) {
  return prisma.label.delete({
    where: {
      id: labelId,
    },
  });
}

export async function connectLabel(chatId: string, labelId: string) {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      labels: {
        connect: {
          id: labelId,
        },
      },
    },
  });
}

export async function disconnectLabel(chatId: string, labelId: string) {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      labels: {
        disconnect: {
          id: labelId,
        },
      },
    },
  });
}

export async function updateChatStatus(chatId: string, status: TicketStatus) {
  return prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      status,
    },
  });
}
