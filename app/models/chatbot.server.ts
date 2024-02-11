import { Model, type Chatbot, type User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";

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
      model: Model.GPT35,
      temperature: 0.7,
      maxTokens: 100,
      systemPrompt: "The following is a conversation with an AI assistant.",
      // stream: false,
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

export function updateChatbotById({
  id,
  name,
  description,
  model,
  temperature,
  maxTokens,
  systemPrompt,
}: Pick<
  Chatbot,
  | "id"
  | "name"
  | "description"
  | "model"
  | "temperature"
  | "maxTokens"
  | "systemPrompt"
>) {
  return prisma.chatbot.update({
    where: { id },
    data: {
      name,
      description,
      model,
      temperature,
      maxTokens,
      systemPrompt,
    },
  });
}

export function updateChatbotAppearanceById({
  id,
  theme,
}: {
  id: Chatbot["id"];
  theme: {
    introMessages?: string;
    starterQuestions?: string;
    color?: string;
    radius?: number;
  };
}) {
  return prisma.chatbot.update({
    where: { id },
    data: theme,
  });
}
