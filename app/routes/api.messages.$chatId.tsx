import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getMessagesByChatId } from "~/models/chat.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { chatId } = params;

  if (!chatId) {
    return json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = await getMessagesByChatId({ chatId });

  return json({ messages });
}
