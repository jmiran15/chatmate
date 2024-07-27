import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
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
import { v4 as uuidv4 } from "uuid";
import { chat } from "~/utils/openai";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import uap from "ua-parser-js";
import { prisma } from "~/db.server";
import { connect } from "http2";

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
    // console.log(`api.chat.${chatbotId}.${sessionId} - ipAddress: ${ipAddress}`);
    // console.log(`api.chat.${chatbotId}.${sessionId} - user agent: `, ua);

    try {
      const ipapiResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const ipData = await ipapiResponse.json();
      // console.log(`api.chat.${chatbotId}.${sessionId} - ipData: `, ipData);
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
  // console.log(
  //   `api.chat.${chatbotId}.${sessionId} - _anonymousUser: `,
  //   _anonymousUser,
  // );

  if (!_chat) {
    return json({ error: "Failed to create chat" }, { status: 500 });
  }

  const { allMessages, unseenMessagesCount } = await getMessagesAndUnseenCount({
    chatId: _chat.id,
  });

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

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

      // try to find the sessionId in the chats
      let _chat: Chat | null = null;
      if (body.chatId) {
        _chat = await getChatById({ chatId: sessionId });
      } else {
        _chat = await getChatBySessionId({ sessionId });
      }

      console.log("_chat", _chat);

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

      const userMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      if (!userMessage) {
        return json({ error: "No user message provided" }, { status: 400 });
      }

      console.log("userMessage", userMessage);
      // add the user message to the chat
      const createdMessage = await createMessage({
        chatId: _chat.id,
        ...userMessage,
      });

      console.log("createdMessage", createdMessage);

      const headers = {
        "Access-Control-Allow-Origin": "*", // Allow any domain
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      };

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
              const assistantResponse = await createMessage({
                chatId: _chat.id,
                role: "assistant",
                content: fullText,
              });
              console.log("assistantResponse", assistantResponse);
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
      // create a new chat with the given sessionId
      const id = uuidv4();
      return await createChatWithStarterMessages({
        sessionId: id,
        chatbotId,
        sId: sessionId,
      });
      // return await clearChatMessages({ chatId: sessionId });
    }
    default: {
      return json({ error: "Invalid method" }, { status: 405 });
    }
  }
};
