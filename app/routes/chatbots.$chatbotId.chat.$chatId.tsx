import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { createMessage, getMessagesByChatId } from "~/models/chat.server";
import { chat } from "~/utils/openai";
import Chat from "~/components/chat/chat";
import { getChatbotById } from "~/models/chatbot.server";
import { useEffect, useState } from "react";

// await createMessage({ chatId, role: "user", content: userMessage });

// return await createMessage({
//   chatId,
//   role: "assistant",
//   content: assistantResponse.message.content,
// });

export default function ChatRoute() {
  // create the two messages in the db

  return <Chat key="chat" />;
}
