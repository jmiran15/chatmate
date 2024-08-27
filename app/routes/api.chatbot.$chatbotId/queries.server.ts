import { prisma } from "~/db.server";

export async function getChatbot({ id }: { id: string }) {
  return prisma.chatbot.findUnique({
    where: { id },
  });
}
