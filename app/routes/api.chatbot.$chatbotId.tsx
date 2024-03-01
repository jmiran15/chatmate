import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbotById } from "~/models/chatbot.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  const chatbot = await getChatbotById({ id: chatbotId });

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return json(chatbot, { headers });
}
