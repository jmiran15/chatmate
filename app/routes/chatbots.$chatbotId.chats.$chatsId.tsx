import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getMessagesByChatId } from "~/models/chat.server";
import Messages from "~/components/chat/messages";
import { getChatbotById } from "~/models/chatbot.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatsId, chatbotId } = params;

  if (!chatsId) {
    throw new Error("chatId is required");
  }

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const [messages, chatbot] = await Promise.all([
    getMessagesByChatId({ chatId: chatsId }),
    getChatbotById({ id: chatbotId }),
  ]);

  return json({ messages, chatbot });
};

export default function ChatRoute() {
  const data = useLoaderData<typeof loader>();

  if (!data?.messages || !data?.chatbot) {
    return null;
  }

  return (
    <Messages messages={data.messages} loading={false} chatbot={data.chatbot} />
  );
}
