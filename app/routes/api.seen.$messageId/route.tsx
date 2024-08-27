// marks an agent/asistant message as seenByUser (i.e. seen by anon user via widget)
import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action = async ({ params }: ActionFunctionArgs) => {
  const { messageId } = params;

  if (!messageId) {
    throw new Error("No messageId provided");
  }

  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });

  if (!message) {
    return new Response(null, { status: 204 });
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
