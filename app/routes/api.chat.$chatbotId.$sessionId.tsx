import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import ChatNotificationEmail from "emails/ChatNotification";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import uap from "ua-parser-js";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "~/db.server";
import {
  Chat,
  createChatWithStarterMessages,
  createMessage,
  getChatById,
  getChatBySessionId,
  getMessagesAndUnseenCount,
  updateChatAIInsights,
  updateChatNameWithAI,
} from "~/models/chat.server";
import { sendEmail } from "~/utils/email.server";
import { chat } from "~/utils/openai";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { sessionId, chatbotId } = params;
  const ua = uap(request.headers.get("User-Agent")!);

  if (!sessionId) {
    return json({ error: "No sessionId provided" }, { status: 400 });
  }

  if (!chatbotId) {
    return json({ error: "No chatbotId provided" }, { status: 400 });
  }

  let _chat = await getChatBySessionId({ sessionId });

  if (!_chat) {
    const id = uuidv4();
    _chat = await createChatWithStarterMessages({
      sessionId: id, // TODO - this is chat id - sId below is the actual sessionId -- bad API!
      chatbotId,
      sId: sessionId,
    });
  }

  let _anonymousUser = await prisma.anonymousUser.findUnique({
    where: {
      sessionId: sessionId,
    },
  });

  if (!_anonymousUser) {
    const isDev = process.env.NODE_ENV === "development";
    const ipAddress = isDev ? "8.8.8.8" : getClientIPAddress(request);

    try {
      const ipapiResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const ipData = await ipapiResponse.json();

      _anonymousUser = await prisma.anonymousUser.create({
        data: {
          sessionId: sessionId,
          ...ipData,
          ua: ua.ua,
          browser_name: ua.browser.name,
          browser_version: ua.browser.version,
          browser_major: ua.browser.major,
          cpu_architecture: ua.cpu.architecture,
          device_type: ua.device.type,
          device_vendor: ua.device.vendor,
          device_model: ua.device.model,
          engine_name: ua.engine.name,
          engine_version: ua.engine.version,
          os_name: ua.os.name,
          os_version: ua.os.version,
          chat: {
            connect: {
              id: _chat.id,
            },
          },
        },
      });
    } catch (error) {
      console.log(
        `api.chat.${chatbotId}.${sessionId} - ipData error: ${error}`,
      );
    }
  }

  if (!_chat) {
    return json({ error: "Failed to create chat" }, { status: 500 });
  }

  const { allMessages, unseenMessagesCount } = await getMessagesAndUnseenCount({
    chatId: _chat.id,
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
    {
      chat: _chat,
      messages: allMessages,
      unseenMessagesCount,
      anonymousUser: _anonymousUser,
    },
    { headers },
  );
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const method = request.method;
  const { sessionId, chatbotId } = params;

  if (!chatbotId) {
    return json({ error: "No chatbot provided" }, { status: 400 });
  }

  if (!sessionId) {
    return json({ error: "No sessionId provided" }, { status: 400 });
  }

  switch (method) {
    case "POST": {
      // chat
      const body = JSON.parse(await request.text());
      const { chatbot, messages, chattingWithAgent } = body;

      const userMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      if (!userMessage) {
        return json({ error: "No user message provided" }, { status: 400 });
      }

      // try to find the sessionId in the chats
      let _chat: Chat | null = null;
      if (body.chatId) {
        _chat = await getChatById({ chatId: sessionId });
      } else {
        _chat = await getChatBySessionId({ sessionId });
      }

      // if no chat, create one with the given sessionId
      if (!_chat) {
        // CREATE NEW ID
        const id = uuidv4();
        _chat = await createChatWithStarterMessages({
          sessionId: id,
          chatbotId,
          sId: sessionId,
        });
      }

      if (!_chat) {
        return json({ error: "Failed to create chat" }, { status: 500 });
      }

      // add the user message to the chat
      const createdMessage = await createMessage({
        chatId: _chat.id,
        ...userMessage,
      });

      // check if the payload only had one user message - meaning its the first message
      if (
        messages.filter(
          (message: { role: string; content: string }) =>
            message.role === "user",
        ).length === 1 &&
        !body.chatId
      ) {
        // get the chatbot
        const chatbot = await prisma.chatbot.findUnique({
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

        // get the chat id
        const chatId = _chat.id;
        const userEmail = chatbot?.user?.email;

        // get the anonymous user
        let _anonymousUser = await prisma.anonymousUser.findUnique({
          where: {
            sessionId: sessionId,
          },
        });

        if (userEmail) {
          const BASE =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://chatmate.so";

          // send email to owner that they have a new chat

          try {
            await sendEmail({
              to: userEmail,
              subject: "Chatmate - New chat",
              react: (
                <ChatNotificationEmail
                  anonymousUser={_anonymousUser}
                  userMessage={createdMessage}
                  chatUrl={`${BASE}/chatbots/${chatbotId}/chats/${chatId}`}
                />
              ),
            });
          } catch (error) {
            console.log("error sending email", error);
          }
        }
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
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      } as HeadersInit;

      if (chattingWithAgent)
        return new Response(null, { status: 200, headers });

      const stream = new ReadableStream({
        start(controller) {
          (async () => {
            let fullText = "";
            const uuid = uuidv4();

            try {
              const chatStream = await chat({
                chatbot,
                messages,
              });

              for await (const chunk of chatStream) {
                for (const choice of chunk.choices) {
                  const delta = choice.delta?.content;
                  if (!delta) continue;

                  fullText += delta;

                  controller.enqueue(
                    `data: ${JSON.stringify({
                      uuid,
                      type: "textResponseChunk",
                      textResponse: delta,
                      sources: [],
                      error: false,
                      close: false,
                    })}\n\n`,
                  );
                }

                controller.enqueue(
                  `data: ${JSON.stringify({
                    uuid,
                    type: "textResponseChunk",
                    textResponse: "",
                    sources: [],
                    error: false,
                    close: true,
                  })}\n\n`,
                );
              }

              // push the final text as a new messsgae in the chat
              await createMessage({
                id: uuid,
                chatId: _chat.id,
                role: "assistant",
                content: fullText,
              });
            } catch (error) {
              console.log("error", error);

              controller.enqueue(
                `data: ${JSON.stringify({
                  uuid,
                  type: "abort",
                  textResponse: null,
                  sources: [],
                  error: error.message,
                  close: true,
                })}\n\n`,
              );
            }

            controller.close();
          })();
        },
      });

      // update name and key insights
      await Promise.all([
        updateChatNameWithAI({ chatId: _chat.id }),
        updateChatAIInsights({ chatId: _chat.id }),
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

      // create a new chat with the given sessionId
      const id = uuidv4();
      const newChat = await createChatWithStarterMessages({
        sessionId: id,
        chatbotId,
        sId: sessionId,
      });

      return json(newChat, { headers });
    }
    default: {
      return json({ error: "Invalid method" }, { status: 405 });
    }
  }
};
