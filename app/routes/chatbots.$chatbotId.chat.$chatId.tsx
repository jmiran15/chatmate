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
  const { chatId, chatbotId } = params;
  const formData = await request.formData();

  // throw error if chatId not found or chatbotId not found

  const userMessage = formData.get("message");

  // throw some error if empty string, or maybe just return if its an empty string or not a string

  const messages = JSON.parse(formData.get("messages") as string) || []; // should do some error checking

  messages.push({
    role: "user",
    content: userMessage,
  });

  // this should intuitivly be defered, only problem is that they messages have no ordering, so we need the user promise to be fulfilled before the others.
  const assistantResponse = await chat({
    chatbotId,
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

  return (
    <div className="h-full flex flex-col justify-between">
      <Chat key="chat" messages={data.messages} chatbot={data.chatbot} />
    </div>
  );
}
