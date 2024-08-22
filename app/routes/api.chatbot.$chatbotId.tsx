import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbotById } from "~/models/chatbot.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  console.log("api.chatbot.$chatbotId - chatbotId: ", chatbotId);
  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const chatbot = await getChatbotById({ id: chatbotId });

  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;

  return json({ chatbot }, { headers });
}
