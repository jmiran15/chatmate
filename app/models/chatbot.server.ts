import type { User } from "@prisma/client";

import { prisma } from "~/db.server";
export type { Chatbot } from "@prisma/client";

export function getChatbotsByUserId({ userId }: { userId: User["id"] }) {
  return prisma.chatbot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
