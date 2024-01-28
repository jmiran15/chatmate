import type { Chatbot, User } from "@prisma/client";

import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";

export function getChatbotsByUserId({ userId }: { userId: User["id"] }) {
  return prisma.chatbot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// create a chatbot with just the name and optional description field
export function createChatbot({
  name,
  description,
  userId,
}: Pick<Chatbot, "name" | "description"> & { userId: User["id"] }) {
  return prisma.chatbot.create({
    data: {
      name,
      description,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
