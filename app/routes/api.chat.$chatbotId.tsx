import { ActionFunctionArgs, json } from "@remix-run/node";
import { chat } from "~/utils/openai";

export async function action({ params, request }: ActionFunctionArgs) {
  const { chatbotId } = params;

  if (!chatbotId) {
    return json(
      { error: "chatbotId is required" },
      { status: 400, statusText: "chatbotId is required" },
    );
  }

  const formData = await request.formData();

  const messages = JSON.parse(formData.get("messages") as string) || [];

  const assistantResponse = await chat({
    chatbotId,
    messages,
  });

  return json(assistantResponse);
}
