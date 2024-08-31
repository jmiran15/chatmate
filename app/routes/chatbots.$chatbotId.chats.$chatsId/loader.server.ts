import { json, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { getChatInfo } from "./queries.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatsId, chatbotId } = params;

  if (!chatsId) {
    throw new Error("chatId is required");
  }

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const chat = await getChatInfo!(chatsId);

  if (!chat) {
    throw new Error("Chat not found");
  }

  // TODO - defer; need skeletons for the anon sidebar
  const anonUser = chat.sessionId
    ? await prisma.anonymousUser.findUnique({
        where: {
          sessionId: chat.sessionId,
        },
      })
    : null;

  const API_PATH =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_BASE
      : process.env.PROD_BASE;

  return json({
    messages: chat.messages,
    chatbot: chat.chatbot,
    chat,
    anonUser,
    API_PATH,
  });
};
