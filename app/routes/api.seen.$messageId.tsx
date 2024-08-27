import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action = async ({ params }: ActionFunctionArgs) => {
  const { messageId } = params;

  if (!messageId) {
    return json({ error: "No messageId provided" }, { status: 400 });
  }

  // make sure the message exists - this probably slows us down unnecessarily!
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });

  if (!message) {
    return json({ error: "Message not found" }, { status: 404 });
  }

  const updateMessage = await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      seenByUser: true,
    },
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
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  } as HeadersInit;

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
