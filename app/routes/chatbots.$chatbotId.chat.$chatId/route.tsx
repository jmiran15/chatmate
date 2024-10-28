import { LoaderFunctionArgs, json } from "@remix-run/node";
import { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import { prisma } from "~/db.server";
import Chat from "./chat";

// when the data connector modal renders, we submit a reset, which triggers this to revalidate

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
  if (formData?.get("intent") === "reset") {
    return false;
  }

  return defaultShouldRevalidate;
}

export default function ChatRoute() {
  return <Chat />;
}
