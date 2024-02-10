import { ActionFunctionArgs, json } from "@remix-run/node";
import { chat } from "~/utils/openai";

// resource route to make a call to chat function from client
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { messages, chatbotId } = body;

  const response = await chat({
    chatbotId,
    messages,
  });

  return json({ response });
}
