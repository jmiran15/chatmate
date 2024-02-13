import { type Chatbot, type User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";

export function getChatbotsByUserId({ userId }: { userId: User["id"] }) {
  return prisma.chatbot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function createChatbot({
  name,
  description,
  userId,
}: Pick<Chatbot, "name" | "description"> & { userId: User["id"] }) {
  return prisma.chatbot.create({
    data: {
      id: uuidv4(),
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

// function to load a chatbot
export function getChatbotById({ id }: { id: Chatbot["id"] }) {
  return prisma.chatbot.findUnique({
    where: { id },
  });
}

export function updateChatbotById(data: Partial<Chatbot>) {
  return prisma.chatbot.update({
    where: { id: data.id },
    data,
  });
}
