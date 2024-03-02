import { ActionFunctionArgs, json } from "@remix-run/node";
import { chat } from "~/utils/openai";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const messages = JSON.parse(formData.get("messages") as string) || [];
  const chatbot = JSON.parse(formData.get("chatbot") as string);

  if (!chatbot) {
    return json({ error: "Chatbot not found" }, { status: 404 });
  }

  const assistantResponse = await chat({
    chatbot,
    messages,
  });

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return json(assistantResponse, { headers });
}
