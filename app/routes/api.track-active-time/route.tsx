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
    return new Response(null, { status: 204 });
  }

  const updatedChat = await prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      elapsedMs: Number(activeTime),
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
  } as HeadersInit;

  return json(
    { updatedChat, success: true },
    {
      headers,
    },
  );
}
