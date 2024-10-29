import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import { prisma } from "~/db.server";
import Chat, { ChatMessage } from "./chat";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "deleteMessages") {
    const messages = JSON.parse(String(formData.get("messages")));
    const deletedMessages = await prisma.message.deleteMany({
      where: { id: { in: messages.map((msg: ChatMessage) => msg.id) } },
    });

    return json({ deletedMessages });
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatId, chatbotId } = params;

  if (!chatId || !chatbotId) {
    throw new Error("Chat ID and Chatbot ID are required");
  }

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_BASE
      : process.env.PROD_BASE;

  // TODO - can probably put this in a prisma transaction
  const [messages, chatbotRes, chat] = await Promise.all([
    prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        form: {
          include: {
            elements: true,
          },
        },
        formSubmission: true,
        revisions: {
          include: {
            document: {
              select: {
                id: true,
                isPending: true,
              },
            },
          },
        },
      },
    }),
    fetch(`${BASE_URL}/api/chatbot/${chatbotId}`),
    prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          include: {
            form: {
              include: {
                elements: true,
              },
            },
            formSubmission: true,
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
    }),
  ]);

  if (!chatbotRes.ok) {
    throw new Error("Failed to fetch chatbot");
  }

  const { chatbot } = await chatbotRes.json();

  console.log("revalidation");

  return json({
    chatbot,
    loaderMessages: messages,
    BASE_URL,
    userMessage: new URL(request.url).searchParams.get("userMessage"),
    loaderChat: chat,
  });
};

export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  const intent = String(formData?.get("intent"));
  if (intent === "reset" || intent === "deleteMessages") {
    return false;
  }

  return defaultShouldRevalidate;
}

export default function ChatRoute() {
  return <Chat />;
}
