// get a chatbot by id
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getChatbot } from "./queries.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const chatbot = await getChatbot({ id: chatbotId });

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
