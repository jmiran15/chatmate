import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  createChatWithStarterMessages,
  createMessage,
} from "~/models/chat.server";

export async function action({ params, request }: ActionFunctionArgs) {
  const { chatbotId } = params;

  if (!chatbotId) {
    return json(
      { error: "chatbotId is required" },
      { status: 400, statusText: "chatbotId is required" },
    );
  }

  const formData = await request.formData();

  const userMessage = JSON.parse(formData.get("message") as string);

  console.log("the user message: ", { userMessage });

  if (!userMessage) {
    return json(
      { error: "message is required" },
      { status: 400, statusText: "message is required" },
    );
  }

  const chat = await createChatWithStarterMessages({
    chatbotId,
  });

  console.log("create the chat: ", { chat });

  await createMessage({
    chatId: chat.id,
    ...userMessage,
  });

  return json({ chatId: chat.id });
}
