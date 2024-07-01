import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action = async ({ params }: ActionFunctionArgs) => {
  const { messageId } = params;

  if (!messageId) {
    return json({ error: "No messageId provided" }, { status: 400 });
  }

  const updateMessage = await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      seen: true,
    },
  });

  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  return json(
    {
      updateMessage,
      ok: true,
    },
    {
      headers,
    },
  );
};
