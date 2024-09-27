import { TriggerType } from "@prisma/client";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { callCustomFlow } from "./api.chat.$chatbotId.$sessionId/customFlows.server";

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
  return json({ success: true }, { headers });
}

export async function action({ params }: ActionFunctionArgs) {
  const { chatId, chatbotId } = params;

  if (!chatId || !chatbotId) {
    return json(
      { success: false, error: "Invalid chat or chatbot" },
      { status: 400 },
    );
  }

  console.log("calling initial load for chat", chatId);

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });

  if (!chat) {
    return json({ success: false, error: "Chat not found" }, { status: 404 });
  }

  if (chat.hasLoadedInitialMessages) {
    return json(
      { success: true, error: "Chat already loaded initial messages" },
      { status: 200 },
    );
  }

  const updatedChat = await prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      hasLoadedInitialMessages: true,
    },
    include: {
      messages: {
        include: {
          form: {
            include: {
              elements: true,
            },
          }, // so we can send over the formSchema
          formSubmission: true, // so we can see if the form was submitted
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              seenByUser: false,
              role: {
                not: "user",
              },
            },
          },
        },
      },
    },
  });

  if (!updatedChat) {
    return json(
      { success: false, error: "Failed to update chat" },
      { status: 500 },
    );
  }

  const flows = await prisma.flow.findMany({
    where: {
      trigger: {
        type: TriggerType.INITIAL_LOAD,
      },
      chatbotId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
    },
  });

  console.log("flows", flows);

  for (const flow of flows) {
    await callCustomFlow(flow.id, chatId);
  }

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
    {
      success: true,
      chat: updatedChat,
    },
    { headers },
  );
}
