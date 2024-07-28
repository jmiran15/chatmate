import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader() {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return json(
    { success: true },
    {
      headers,
    },
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const { sessionId, activeTime } = await request.json();

  const chat = await prisma.chat.findFirst({
    where: {
      sessionId: sessionId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  const updatedChat = await prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      elapsedMs: Number(activeTime),
    },
  });

  console.log("api.track-active-time - updatedChat: ", updatedChat);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return json(
    { updatedChat, success: true },
    {
      headers,
    },
  );
}
