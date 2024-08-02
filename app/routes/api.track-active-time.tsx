import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader() {
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
    // throw new Error("Chat not found");
    console.log("api.track-active-time - chat not found");
    return json({ success: true });
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

  return json(
    { updatedChat, success: true },
    {
      headers,
    },
  );
}
