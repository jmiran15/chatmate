import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createMessage, getMessagesByChatId } from "~/models/chat.server";
import { chat } from "~/utils/openai";
import Chat from "~/components/chat/chat";
import { getChatbotById } from "~/models/chatbot.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatId, chatbotId } = params;
  const messages = await getMessagesByChatId({ chatId });

  // need to cache this value! maybe in a cookie or something
  const chatbot = await getChatbotById({ id: chatbotId });

  return json({ messages, chatbot });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatId } = params;
  const formData = await request.formData();

  const userMessage = formData.get("message") as string;
  const messages = JSON.parse(formData.get("messages") as string) || []; // should do some error checking
  const chatbot = JSON.parse(formData.get("chatbot") as string);

  if (!chatbot) {
    return json({ error: "Chatbot not found" }, { status: 404 });
  }

  if (!chatId) {
    return json({ error: "Chat not found" }, { status: 404 });
  }

  if (!userMessage) {
    return json({ error: "Message not found" }, { status: 400 });
  }

  messages.push({
    role: "user",
    content: userMessage,
  });

  // this should intuitivly be defered, only problem is that they messages have no ordering, so we need the user promise to be fulfilled before the others.
  const assistantResponse = await chat({
    chatbot,
    messages,
  });

  await createMessage({ chatId, role: "user", content: userMessage });

  return await createMessage({
    chatId,
    role: "assistant",
    content: assistantResponse.message.content,
  });
};

export default function ChatRoute() {
  const data = useLoaderData<typeof loader>();

  return <Chat key="chat" messages={data.messages} chatbot={data.chatbot} />;
}
