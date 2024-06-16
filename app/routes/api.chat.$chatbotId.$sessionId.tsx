import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Chat,
  createChatWithStarterMessages,
  createMessage,
  getChatById,
  getChatBySessionId,
  getMessagesByChatId,
  updateChatAIInsights,
  updateChatNameWithAI,
} from "~/models/chat.server";
import { v4 as uuidv4 } from "uuid";
import { chat } from "~/utils/openai";

export async function loader({ params }: LoaderFunctionArgs) {
  const { sessionId, chatbotId } = params;

  if (!sessionId) {
    return json({ error: "No sessionId provided" }, { status: 400 });
  }

  if (!chatbotId) {
    return json({ error: "No chatbotId provided" }, { status: 400 });
  }

  // first try to find the chat with that session ID, if it exists, get the messages and return, otherwise, create the chat with that id and return the messages in that chat
  let _chat = await getChatBySessionId({ sessionId });

  console.log("_chat", _chat);

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

  const messages = await getMessagesByChatId({ chatId: _chat.id });

  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return json(messages, { headers });
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
      const { chatbot, messages } = body;

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

              console.log("chatStream", chatStream);

              for await (const chunk of chatStream) {
                for (const choice of chunk.choices) {
                  console.log("choice", choice);

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
              console.log("fullText", fullText);

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

      const headers = {
        "Access-Control-Allow-Origin": "*", // Allow any domain
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      };

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
