import { createId } from "@paralleldrive/cuid2";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import ChatNotificationEmail from "emails/ChatNotification";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import uap from "ua-parser-js";
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

interface SSEMessage {
  id: string;
  type: "textResponseChunk" | "abort";
  textResponse: string | null;
  error: string | null;
  streaming: boolean;
}

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
    const id = createId();
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
      const { messages, chattingWithAgent } = body;

      // get the chatbot - CACHE THIS ...
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

      const userMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      // TODO - make sure this is an actual user message, i.e role === user

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
        const id = createId();
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
            const id = createId();

            try {
              console.log(
                "messages: ",
                messages.map((message: any) => ({
                  role: message.role,
                  content: message.content,
                })),
              );

              // just so we don't have to send this over the wire every time, just fetch it here from cache
              const chatStream = await chat({
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

                // controller.enqueue(
                //   `data: ${JSON.stringify({
                //     id,
                //     type: "textResponseChunk",
                //     textResponse: "",
                //     error: null,
                //     streaming: false,
                //   } as SSEMessage)}\n\n`,
                // );
              }
              // enqueue the final message - indicating we finished streaming
              controller.enqueue(
                `data: ${JSON.stringify({
                  id,
                  type: "textResponseChunk",
                  textResponse: "",
                  error: null,
                  streaming: false,
                } as SSEMessage)}\n\n`,
              );

              // push the final text as a new message in the chat
              await createMessage({
                id,
                chatId: _chat.id,
                role: "assistant",
                content: fullText,
              });
            } catch (error: any) {
              console.log("error", error);

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
      const id = createId();
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
