import { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "~/db.server";
import { serverOnly$ } from "vite-env-only/macros";

export const getChatInfo = serverOnly$(async (chatId: string) => {
  return prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      chatbot: {
        include: { labels: { select: { id: true, name: true, color: true } } },
      },
      labels: { select: { id: true, name: true, color: true } },
    },
  });
});

export const deleteChat = serverOnly$(
  async ({
    chatId,
    chatbotId,
    starredQuery,
    createdAtQuery,
  }: {
    chatId: string;
    chatbotId: string;
    starredQuery: { starred: boolean } | { starred?: undefined };
    createdAtQuery: { createdAt: Prisma.SortOrder };
  }) => {
    return prisma.$transaction(async (tx) => {
      const WHERE = {
        chatbotId,
        ...starredQuery,
        userId: null,
        deleted: false,
        messages: { some: { role: "user" } },
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
  },
);

export const markChatAsSeen = serverOnly$(
  async ({ chatId }: { chatId: string }) => {
    return prisma.chat.update({
      where: { id: chatId },
      data: { seen: true },
    });
  },
);

export const createLabel = serverOnly$(
  async ({ name, chatbotId }: { name: string; chatbotId: string }) => {
    return prisma.label.create({
      data: { name, chatbotId },
    });
  },
);

export const updateLabel = serverOnly$(
  async ({
    labelId,
    name,
    color,
  }: {
    labelId: string;
    name: string;
    color: string;
  }) => {
    return prisma.label.update({
      where: { id: labelId },
      data: { name, color },
    });
  },
);

export const deleteLabel = serverOnly$(
  async ({ labelId }: { labelId: string }) => {
    return prisma.label.delete({
      where: { id: labelId },
    });
  },
);

export const connectLabel = serverOnly$(
  async ({ chatId, labelId }: { chatId: string; labelId: string }) => {
    return prisma.chat.update({
      where: { id: chatId },
      data: { labels: { connect: { id: labelId } } },
    });
  },
);

export const disconnectLabel = serverOnly$(
  async ({ chatId, labelId }: { chatId: string; labelId: string }) => {
    return prisma.chat.update({
      where: { id: chatId },
      data: { labels: { disconnect: { id: labelId } } },
    });
  },
);

export const updateChatStatus = serverOnly$(
  async ({ chatId, status }: { chatId: string; status: TicketStatus }) => {
    return prisma.chat.update({
      where: { id: chatId },
      data: { status },
    });
  },
);
