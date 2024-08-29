import { createId } from "@paralleldrive/cuid2";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import ChatNotificationEmail from "emails/ChatNotification";
import { prisma } from "~/db.server";
import { sendEmail } from "~/utils/email.server";
import { chat as streamChat } from "~/utils/openai";
import { startInsightsFlow, startNameGenerationFlow } from "./flows.server";
import {
  createAnonymousChat,
  createAnonymousUser,
  createMessage,
  getAnonymousUserBySessionId,
  getChatById,
  getLatestChatBySessionID,
} from "./queries.server";

interface SSEMessage {
  id: string;
  type: "textResponseChunk" | "abort";
  textResponse: string | null;
  error: string | null;
  streaming: boolean;
}

// create types for the payloads and the outputs
// then whenever we call these API routes - use those types

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { sessionId, chatbotId } = params;

  if (!sessionId) {
    throw new Error("No sessionId provided");
  }

  if (!chatbotId) {
    throw new Error("No chatbotId provided");
  }

  const latestChatBySessionID =
    (await getLatestChatBySessionID({
      sessionId,
    })) ?? (await createAnonymousChat({ sessionId, chatbotId }));

  if (!latestChatBySessionID) {
    throw new Error(`Failed to create or find chat for session ${sessionId}`);
  }

  const anonymousUser =
    (await getAnonymousUserBySessionId({ sessionId })) ??
    (await createAnonymousUser({
      sessionId,
      request,
      chatId: latestChatBySessionID.id,
    }));

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
      chat: latestChatBySessionID,
      messages: latestChatBySessionID.messages,
      unseenMessagesCount: latestChatBySessionID._count.messages,
      anonymousUser,
    },
    { headers },
  );
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { method } = request;
  const { sessionId: sessionIdOrChatId, chatbotId } = params; // sessionId can be chatId (which allows us to reuse this route for both anon users and logged in users)

  if (!chatbotId) {
    throw new Error("No chatbotId provided");
  }

  if (!sessionIdOrChatId) {
    throw new Error("No sessionId or ChatId provided");
  }

  switch (method) {
    case "POST": {
      const {
        messages,
        chattingWithAgent,
        chatId,
      }: {
        messages: any[];
        chattingWithAgent: boolean;
        chatId?: boolean;
      } = await request.json();

      // TODO - cache the chatbot with lru-cache (and maybe other queries too)
      const chatbot = await prisma.chatbot.findUniqueOrThrow({
        where: {
          id: chatbotId,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      const userMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      if (!userMessage || (userMessage.role !== "user" && !chattingWithAgent)) {
        throw new Error("No user message provided");
      }

      const chat = chatId
        ? await getChatById({ chatId: sessionIdOrChatId })
        : (await getLatestChatBySessionID({
            sessionId: sessionIdOrChatId,
          })) ??
          (await createAnonymousChat({
            sessionId: sessionIdOrChatId,
            chatbotId,
          }));

      if (!chat) {
        throw new Error(
          `Failed to create or find chat for session ${sessionIdOrChatId}`,
        );
      }

      console.log("userMessage: ", userMessage);

      const createdUserMessage = await createMessage({
        chatId: chat.id,
        ...userMessage,
      });

      console.log("createdUserMessage: ", createdUserMessage);

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

      if (chattingWithAgent) {
        return new Response(null, { status: 200, headers });
      }

      // check if the payload only had one user message - meaning its the first message
      if (
        messages.filter(
          (message: { role: string; content: string }) =>
            message.role === "user",
        ).length === 1 &&
        !chatId
      ) {
        const userEmail = chatbot.user.email;

        const anonymousUser = await getAnonymousUserBySessionId({
          sessionId: sessionIdOrChatId,
        });

        if (userEmail) {
          const BASE =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://chatmate.so";

          try {
            await sendEmail({
              to: userEmail,
              subject: "Chatmate - New chat",
              react: (
                <ChatNotificationEmail
                  anonymousUser={anonymousUser}
                  userMessage={createdUserMessage}
                  chatUrl={`${BASE}/chatbots/${chatbotId}/chats/${chat.id}`}
                />
              ),
            });
          } catch (error) {
            console.error("Failed to send email", error);
          }
        }
      }

      const stream = new ReadableStream({
        start(controller) {
          (async () => {
            let fullText = "";
            const id = createId();

            try {
              const chatStream = await streamChat({
                chatbot,
                messages: messages.map((message: any) => ({
                  role: message.role,
                  content: message.content,
                })),
              });

              for await (const chunk of chatStream) {
                for (const choice of chunk.choices) {
                  const delta = choice.delta?.content;
                  if (!delta) continue;

                  fullText += delta;

                  controller.enqueue(
                    `data: ${JSON.stringify({
                      id,
                      type: "textResponseChunk",
                      textResponse: delta,
                      error: null,
                      streaming: true,
                    } as SSEMessage)}\n\n`,
                  );
                }
              }

              controller.enqueue(
                `data: ${JSON.stringify({
                  id,
                  type: "textResponseChunk",
                  textResponse: "",
                  error: null,
                  streaming: false,
                } as SSEMessage)}\n\n`,
              );

              await createMessage({
                id,
                chatId: chat.id,
                role: "assistant",
                content: fullText,
              });
            } catch (error: any) {
              console.error("Failed to stream chat", error);

              controller.enqueue(
                `data: ${JSON.stringify({
                  id,
                  type: "abort",
                  textResponse: null,
                  error: error.message,
                  streaming: false,
                } as SSEMessage)}\n\n`,
              );
            }

            controller.close();
          })();
        },
      });

      // TODO - add more AI post processing like markResolved/not, add tags, etc...
      // TODO - test this and make sure it works
      // TODO - add progress streaming to the client
      const [nameFlow, insightsFlow] = await Promise.all([
        startNameGenerationFlow({ chatId: chat.id }),
        startInsightsFlow({ chatId: chat.id }),
      ]);

      return new Response(stream, {
        headers,
      });
    }
    case "DELETE": {
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

      const newChat = await createAnonymousChat({
        sessionId: sessionIdOrChatId,
        chatbotId,
      });

      return json({ chat: newChat }, { headers });
    }
    default: {
      throw new Error("Method not allowed");
    }
  }
};
