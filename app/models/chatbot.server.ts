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
  userId,
}: Pick<Chatbot, "name"> & { userId: User["id"] }) {
  return prisma.chatbot.create({
    data: {
      id: uuidv4(),
      name,
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

export function updateChatbotById(data: Partial<Chatbot>) {
  return prisma.chatbot.update({
    where: { id: data.id },
    data,
  });
}

// delete a chatbot by its id
export function deleteChatbotById({ id }: { id: Chatbot["id"] }) {
  return prisma.chatbot.delete({
    where: { id },
  });
}

// get all chatbots
export function getAllChatbots() {
  return prisma.chatbot.findMany();
}
