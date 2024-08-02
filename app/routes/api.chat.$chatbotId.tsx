import { ActionFunctionArgs, json } from "@remix-run/node";
import { chat } from "~/utils/openai";

export async function action({ request }: ActionFunctionArgs) {
  // data is coming in as json not formdata

  const body = JSON.parse(await request.text());
  const { chatbot, messages } = body;

  if (!chatbot) {
    return json({ error: "Chatbot not found" }, { status: 404 });
  }

  const assistantResponse = await chat({
    chatbot,
    messages,
  });

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

  return json(assistantResponse, { headers });
}
