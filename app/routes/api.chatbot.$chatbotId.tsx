import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbotById } from "~/models/chatbot.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  const chatbot = await getChatbotById({ id: chatbotId });

  return json(chatbot);
}
