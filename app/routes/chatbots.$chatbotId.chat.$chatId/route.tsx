import { LoaderFunctionArgs, json } from "@remix-run/node";
import Chat from "~/components/chat/chat";
import { prisma } from "~/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatId, chatbotId } = params;

  if (!chatId || !chatbotId) {
    throw new Error("Chat ID and Chatbot ID are required");
  }

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_BASE
      : process.env.PROD_BASE;

  const [messages, chatbotRes] = await Promise.all([
    prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        form: true,
        formSubmission: true,
      },
    }),
    fetch(`${BASE_URL}/api/chatbot/${chatbotId}`),
  ]);

  if (!chatbotRes.ok) {
    throw new Error("Failed to fetch chatbot");
  }

  const { chatbot } = await chatbotRes.json();

  return json({
    chatbot,
    messages,
    BASE_URL,
    userMessage: new URL(request.url).searchParams.get("userMessage"),
  });
};

export default function ChatRoute() {
  return <Chat key="chat" />;
}
