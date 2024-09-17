import { createId } from "@paralleldrive/cuid2";
import { Trigger } from "@prisma/client";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import ChatNotificationEmail from "emails/ChatNotification";
import {
  ChatCompletionChunk,
  ChatCompletionMessage,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import { prisma } from "~/db.server";
import { getChat } from "~/queues/chat/db/getChat";
import { sendEmail } from "~/utils/email.server";
import { chat as streamChat } from "~/utils/openai";
import { mainTools } from "~/utils/prompts";
import { openai } from "~/utils/providers.server";
import { requestLiveChat } from "~/utils/requestLiveChat.server";
import { callCustomFlow } from "./customFlows.server";
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

      // get the custom flows, as "extraTools"
      // format them as actual JSON schema tools
      // pass them into the streamChat function as "extraTools"
      const customFlows = await prisma.flow.findMany({
        where: {
          chatbotId,
          trigger: Trigger.CUSTOM_EVENT,
        },
      });

      let extraTools = customFlows
        .map((flow) => {
          if (!flow.flowSchema) {
            throw new Error("Flow schema is null");
          }
          return {
            type: "function",
            function: {
              name: flow.id,
              description: flow.flowSchema.trigger.description,
            },
          };
        })
        .filter(Boolean) as ChatCompletionTool[];

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

      const createdUserMessage = await createMessage({
        chatId: chat.id,
        ...userMessage,
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

      if (chattingWithAgent) {
        return new Response(null, { status: 200, headers });
      }

      const agentEmail = chatbot.user.email;

      // check if the payload only had one user message - meaning its the first message
      if (
        messages.filter(
          (message: { role: string; content: string }) =>
            message.role === "user",
        ).length === 1 &&
        !chatId
      ) {
        const anonymousUser = await getAnonymousUserBySessionId({
          sessionId: sessionIdOrChatId,
        });

        if (agentEmail) {
          const BASE =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://chatmate.so";

          try {
            await sendEmail({
              to: agentEmail,
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

      async function callTool(
        tool_call: ChatCompletionMessageToolCall,
      ): Promise<{
        message: any;
        continue: boolean;
      }> {
        if (tool_call.type !== "function")
          throw new Error("Unexpected tool_call type:" + tool_call.type);
        const args = JSON.parse(tool_call.function.arguments);
        switch (tool_call.function.name) {
          case "requestLiveChat":
            console.log("REQUESTING LIVE CHAT");
            // inside of here we should controller.enqueue() created activity message, IF it was successful
            return {
              message: await requestLiveChat({
                userEmail: args["userEmail"],
                agentEmail,
                agentConnected: false, // TODO - implement this! -> socket.io
                chatId: chat!.id!,
              }),
              continue: true,
            };
          // case "sendPricingCarousel":
          //   console.log("SENDING PRICING CAROUSEL");
          //   return {
          //     message: await callCustomFlow(tool_call.function.name, chat!.id!),
          //     continue: false,
          //   };
          default: {
            // throw new Error("No function found");
            // check if the tool call is a custom flow

            const output = await callCustomFlow(
              tool_call.function.name,
              chat!.id!,
            );

            if (output.success) {
              return {
                message: output,
                continue: false,
              };
            } else {
              return {
                message: output.error,
                continue: true,
              };
            }
          }
        }
      }
      let sessionId = createId();

      const stream = new ReadableStream({
        start(controller) {
          (async () => {
            let callingTools = true;
            while (callingTools) {
              let fullText = "";
              const id = createId();

              try {
                const lastMessageIsUser =
                  messages[messages.length - 1].role === "user";

                // if the lastMessage is not a user message, it means that we are doing a tool call
                const chatStream = lastMessageIsUser
                  ? await streamChat({
                      chatbot,
                      messages: messages.map((message: any) => ({
                        role: message.role,
                        content: message.content,
                      })),
                      extraTools,
                      sessionId,
                      chatName:
                        `${chat.name}-${sessionId}` ??
                        `Untitled Chat-${sessionId}`,
                    })
                  : await openai.chat.completions.create(
                      {
                        messages,
                        model: "gpt-4o",
                        temperature: 0,
                        stream: true,
                        tools: [...mainTools, ...extraTools],
                      },
                      {
                        headers: {
                          "Helicone-Property-Environment": process.env.NODE_ENV,
                          "Helicone-Session-Id": sessionId, // the message id
                          "Helicone-Session-Path": "/message", // /message
                          "Helicone-Session-Name":
                            `${chat.name}-${sessionId}` ??
                            `Untitled Chat-${sessionId}`, // the chat name
                        },
                      },
                    );

                let message = {} as ChatCompletionMessage;
                for await (const chunk of chatStream) {
                  message = messageReducer(message, chunk);

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

                messages.push(message);

                // If there are no tool calls, we're done and can exit this loop
                if (!message.tool_calls && message.content) {
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
                    role: message.role,
                    content: message.content ?? "",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    clusterId: null,
                    seenByUser: null,
                    seenByAgent: null,
                    seenByUserAt: null,
                    activity: null,
                    // this is probably not needed, the IF statement above should prevent this from happening
                    toolCalls: message.tool_calls
                      ? {
                          create: message.tool_calls.map((toolCall) => ({
                            id: toolCall.id,
                            type: toolCall.type,
                            function: {
                              create: {
                                name: toolCall.function.name,
                                arguments: toolCall.function.arguments,
                              },
                            },
                          })),
                        }
                      : undefined,
                  });

                  callingTools = false;

                  // now we want to leave the while loop immediately
                  break;
                }

                // If there are tool calls, we generate a new message with the role 'tool' for each tool call.
                if (message.tool_calls) {
                  // removes the dummy message for loading purposes on the client side
                  // enqueue a blank message to the last message that was already in the array

                  // maybe move this after the await callTool() and only if the tool call was successful
                  controller.enqueue(
                    `data: ${JSON.stringify({
                      type: "toolCall",
                    })}\n\n`,
                  );

                  // TODO - the messages.pop() inside here will only work if only one tool was called
                  for (const toolCall of message.tool_calls) {
                    const { message: result, continue: shouldContinue } =
                      await callTool(toolCall);

                    // means the tool call was successful
                    if (!shouldContinue) {
                      const newMessage = {
                        tool_call_id: toolCall.id,
                        role: "tool" as const,
                        name: toolCall.function.name,
                        content: JSON.stringify(result),
                      };
                      console.log("TOOL MESSAGE: ", newMessage);
                      messages.push(newMessage);

                      callingTools = false;
                      break;
                    } else {
                      // remove the tool from the extraTools array
                      // continue the while loop
                      extraTools = extraTools.filter(
                        (tool) => tool.function.name !== toolCall.function.name,
                      );

                      // pop the last message from the messages array
                      messages.pop();
                      console.log("EXTRA TOOLS: ", extraTools);
                      continue;
                    }
                  }
                }
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

                // if there was an error, we want to break out of the while loop
                callingTools = false;
                break;
              }
            }

            controller.close();
          })();
        },
      });

      // TEST
      const job = await getChat.add("up", {
        chatId: chat.id,
      });

      console.log("JOB: ", job);

      console.log("POST PROCESSING SESSION ID: ", sessionId);
      // TODO - add more AI post processing like markResolved/not, add tags, etc...
      // TODO - test this and make sure it works
      // TODO - add progress streaming to the client
      const [nameFlow, insightsFlow] = await Promise.all([
        startNameGenerationFlow({
          chatId: chat.id,
          sessionId: sessionId!,
          sessionName: `${chat.name ?? `Untitled Chat`}-${sessionId}`,
        }),
        startInsightsFlow({
          chatId: chat.id,
          sessionId: sessionId!,
          sessionName: `${chat.name ?? `Untitled Chat`}-${sessionId}`,
        }),
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

function messageReducer(
  previous: ChatCompletionMessage,
  item: ChatCompletionChunk,
): ChatCompletionMessage {
  const reduce = (acc: any, delta: ChatCompletionChunk.Choice.Delta) => {
    acc = { ...acc };
    for (const [key, value] of Object.entries(delta)) {
      if (acc[key] === undefined || acc[key] === null) {
        acc[key] = value;
        //  OpenAI.Chat.Completions.ChatCompletionMessageToolCall does not have a key, .index
        if (Array.isArray(acc[key])) {
          for (const arr of acc[key]) {
            delete arr.index;
          }
        }
      } else if (typeof acc[key] === "string" && typeof value === "string") {
        acc[key] += value;
      } else if (typeof acc[key] === "number" && typeof value === "number") {
        acc[key] = value;
      } else if (Array.isArray(acc[key]) && Array.isArray(value)) {
        const accArray = acc[key];
        for (let i = 0; i < value.length; i++) {
          const { index, ...chunkTool } = value[i];
          if (index - accArray.length > 1) {
            throw new Error(
              `Error: An array has an empty value when tool_calls are constructed. tool_calls: ${accArray}; tool: ${value}`,
            );
          }
          accArray[index] = reduce(accArray[index], chunkTool);
        }
      } else if (typeof acc[key] === "object" && typeof value === "object") {
        acc[key] = reduce(acc[key], value);
      }
    }
    return acc;
  };
  return reduce(previous, item.choices[0]!.delta) as ChatCompletionMessage;
}
