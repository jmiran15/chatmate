// api to add messages to an existing chat
import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  createMessage,
  updateChatAIInsights,
  updateChatNameWithAI,
} from "~/models/chat.server";

export async function action({ params, request }: ActionFunctionArgs) {
  const { chatId } = params;

  if (!chatId) {
    return json(
      { error: "chatId is required" },
      { status: 400, statusText: "chatId is required" },
    );
  }

  const formData = await request.formData();
  const message = JSON.parse(formData.get("message") as string) as {
    role: "user" | "assistant";
    content: string;
  };

  if (!message) {
    return json(
      { error: "userMessage is required" },
      { status: 400, statusText: "userMessage is required" },
    );
  }

  const createdMessage = await createMessage({
    chatId,
    ...message,
  });

  // update name and key insights
  await Promise.all([
    updateChatNameWithAI({ chatId }),
    updateChatAIInsights({ chatId }),
  ]);

  return json({ result: createdMessage });
}
