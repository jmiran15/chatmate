import { LoaderFunctionArgs, json } from "@remix-run/node";
import Chat from "~/components/chat/chat";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatId, chatbotId } = params;

  if (!chatId) {
    throw new Error("Chat ID is required");
  }

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  const BASE_URL = isDev ? process.env.DEV_BASE : process.env.PROD_BASE;

  const messagesRes = await fetch(`${BASE_URL}/api/messages/${chatId}`);
  const { messages } = await messagesRes.json();

  const chatbotRes = await fetch(`${BASE_URL}/api/chatbot/${chatbotId}`);
  const chatbot = await chatbotRes.json();

  return json({
    chatbot,
    messages,
    BASE_URL,
  });
};

export default function ChatRoute() {
  return <Chat key="chat" />;
}
