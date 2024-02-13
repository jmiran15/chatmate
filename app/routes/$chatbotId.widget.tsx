import { useLoaderData, useParams } from "@remix-run/react";
// import localforage from "localforage";
import {
  createChat,
  createMessage,
  getMessagesByChatId,
} from "~/models/chat.server";

import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { chat } from "~/utils/openai";
import { widgetChat } from "~/cookies.server";
import Widget from "~/components/widget/widget";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await widgetChat.parse(cookieHeader)) || {};

  console.log("cookie", cookieHeader);

  if (!cookie.chatId) {
    const chat = await createChat({ chatbotId });
    cookie.chatId = chat.id;
  }

  const messages = await getMessagesByChatId({ chatId: cookie.chatId });
  return json(
    { messages },
    {
      headers: {
        "Set-Cookie": await widgetChat.serialize({
          chatId: cookie.chatId,
        }),
      },
    },
  );
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { chatbotId } = params;

  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await widgetChat.parse(cookieHeader)) || {};

  if (!cookie.chatId) {
    const chat = await createChat({ chatbotId });
    cookie.chatId = chat.id;
  }

  const formData = await request.formData();
  const userMessage = formData.get("message");
  const messages = JSON.parse(formData.get("messages") as string) || [];

  messages.push({
    role: "user",
    content: userMessage,
  });

  const assistantResponse = await chat({
    chatbotId,
    messages,
  });

  await createMessage({
    chatId: cookie.chatId,
    role: "user",
    content: userMessage,
  });
  await createMessage({
    chatId: cookie.chatId,
    role: "assistant",
    content: assistantResponse.message.content,
  });

  return new Response("", {
    headers: {
      "Set-Cookie": await widgetChat.serialize({
        chatId: cookie.chatId,
      }),
    },
  });
}

export default function ChatWidget() {
  const data = useLoaderData<typeof loader>();
  const { chatbotId } = useParams();

  return (
    <Widget
      messages={data.messages.map((message) => {
        return { role: message.role, content: message.content };
      })}
      chatbotId={chatbotId}
    />
  );
}
