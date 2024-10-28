// TODO - use `nuqs` for search param state management
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useLoaderData, useParams, useSearchParams } from "@remix-run/react";
import axios from "axios";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEventSource } from "remix-utils/sse/react";
import { useScrollToBottom } from "~/hooks/useScroll";
import { useSocket } from "~/providers/socket";
import { loader } from "~/routes/chatbots.$chatbotId.chat.$chatId/route";
import { useMobileScreen } from "~/utils/mobile";
import { Button } from "../../components/ui/button";
import { Loading } from "../../components/ui/loading";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../components/ui/use-toast";
import { AnalyzeProgressData } from "../api.analyze.$chatId.progress";
import ChatInput from "./chat-input";
import { FormMessage } from "./form-message";
import { SingleMessageContent } from "./message";
import { useMessageProcessor } from "./use-message-processor";

// TODO - replace this with the new PreviewMarkdown component that uses mdx.js
const Markdown = lazy(() => import("../../components/ui/markdown"));

interface SSEMessage {
  id: string;
  type: "textResponseChunk" | "abort";
  textResponse: string | null;
  error: string | null;
  streaming: boolean;
}

type MessageWithFormData = SerializeFrom<
  Prisma.MessageGetPayload<{
    include: {
      form: {
        include: {
          elements: true;
        };
      };
      formSubmission: true;
    };
  }>
>;

type ChatWithFormData = SerializeFrom<
  Prisma.ChatGetPayload<{
    include: {
      messages: {
        include: {
          form: {
            include: {
              elements: true;
            };
          };
          formSubmission: true;
        };
        orderBy: {
          createdAt: "asc";
        };
      };
      _count: {
        select: {
          messages: {
            where: {
              seenByUser: false;
              role: {
                not: "user";
              };
            };
          };
        };
      };
    };
  }>
>;

export interface ChatMessage extends MessageWithFormData {
  streaming: boolean;
  error?: string;
}

export const CHAT_PAGE_SIZE = 15;

export default function Chat() {
  const { chatId, chatbotId } = useParams();
  const socket = useSocket();
  const { toast } = useToast();
  const { chatbot, loaderMessages, BASE_URL, userMessage, loaderChat } =
    useLoaderData<typeof loader>();
  const [loading, setLoading] = useState<boolean>(true);
  const [userInput, setUserInput] = useState(() => userMessage ?? "");
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => loaderMessages?.map((msg) => ({ ...msg, streaming: false })) ?? [],
  );
  const [chat, setChat] = useState<SerializeFrom<ChatWithFormData> | null>(
    loaderChat,
  );
  const [_, setSearchParams] = useSearchParams();
  const [followUps, setFollowUps] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, messages.length - CHAT_PAGE_SIZE),
  );
  const isMobileScreen = useMobileScreen();
  const eventSource = useEventSource(`/api/analyze/${chatId}/progress`);
  const progress: AnalyzeProgressData | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);

  console.log("rerender: ", chatbot);

  useEffect(() => {
    if (progress && progress.completed && progress.returnvalue) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === progress.returnvalue?.id
            ? {
                ...msg,
                didNotFulfillQuery: progress.returnvalue.didNotFulfillQuery,
                reasoning: progress.returnvalue.reasoning,
              }
            : msg,
        ),
      );
    }
  }, [progress]);

  useEffect(() => {
    setMessages(
      loaderMessages?.map((msg) => ({
        ...msg,
        streaming: false,
      })) ?? [],
    );
    setChat(loaderChat);

    // TODO - this is a temporary solution to show initial starter questions
    const showInitalStarterQuestions =
      loaderMessages?.length <= (chatbot?.introMessages?.length || 0);

    if (showInitalStarterQuestions) {
      setFollowUps(chatbot?.starterQuestions || []);
    } else {
      console.log(
        "setting follow ups to empty array - showInitalStarterQuestions",
      );
      setFollowUps([]);
    }

    // example queries
    if (userMessage) {
      handleSubmit({ preventDefault: () => {} } as any);
      setSearchParams((prev) => {
        prev.delete("userMessage");
        return prev;
      });
    }

    if (
      !chat?.hasLoadedInitialMessages &&
      showInitalStarterQuestions &&
      chatId &&
      chatbotId
    ) {
      axios
        .post(`${BASE_URL}/api/initialload/${chatId}/${chatbotId}`)
        .then((res) => {
          const { chat } = res.data;
          setChat(chat);
        })
        .catch((error) => {
          setMessages([]);
          setLoading(false);
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", error.message);
          }
          console.log(error.config);
        });
    }
  }, [chatId, chatbotId, loaderChat, loaderMessages, chatbot, userMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userInput || userInput === "") return false;

    const userMessage = userMsg({ userInput, chatId: chatId! });
    const assistantMessage = initialAssistantMsg({ chatId: chatId! });

    const prevChatHistory: ChatMessage[] = [
      ...messages,
      userMessage,
      assistantMessage,
    ];

    setLoading(true);
    setMessages(prevChatHistory);
    setUserInput("");
    console.log("setting follow ups to empty array- handleSubmit");
    setFollowUps([]);

    return await streamChat({
      message: userInput,
    });
  };

  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(messages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const msgs = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      messages.length,
    );
    return messages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, messages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom = bottomHeight >= e.scrollHeight - 10;

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setAutoScroll(isHitBottom);
  };

  function scrollToBottom() {
    setMsgRenderIndex(messages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  const streamChat = async ({
    message,
  }: {
    message: string;
  }): Promise<void> => {
    const userMessage = userMsg({ userInput: message, chatId: chatId! });
    const _messages: ChatMessage[] = [...messages, userMessage];
    console.log("setting follow ups to empty array- streamChat");
    setFollowUps([]);

    const ctrl = new AbortController();

    await fetchEventSource(`${BASE_URL}/api/chat/${chatbotId}/${chatId}`, {
      method: "POST",
      body: JSON.stringify({
        messages: [
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          {
            role: "user",
            content: message,
          },
        ],
        chattingWithAgent: false,
        chatId: true,
      }),
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          return;
        } else if (response.status >= 400) {
          await response
            .json()
            .then((serverResponse) => {
              handleChat({
                sseMessage: serverResponse,
                _messages,
              });
            })
            .catch(() => {
              handleChat({
                sseMessage: {
                  id: createId(),
                  type: "abort",
                  textResponse: null,
                  streaming: false,
                  error: `An error occurred while streaming response. Code ${response.status}`,
                },
                _messages,
              });
            });
          ctrl.abort();
          throw new Error();
        } else {
          await handleChat({
            sseMessage: {
              id: createId(),
              type: "abort",
              textResponse: null,
              streaming: false,
              error: `An error occurred while streaming response. Unknown Error.`,
            },
            _messages,
          });
          ctrl.abort();
          throw new Error("Unknown Error");
        }
      },
      async onmessage(msg) {
        try {
          const sseMessage = JSON.parse(msg.data);
          await handleChat({
            sseMessage,
            _messages,
          });
        } catch {}
      },
      onerror(err) {
        handleChat({
          sseMessage: {
            id: createId(),
            type: "abort",
            textResponse: null,
            streaming: false,
            error: `An error occurred while streaming response. ${err.message}`,
          },
          _messages,
        });
        ctrl.abort();
        throw new Error();
      },
    });
  };

  async function handleChat({
    sseMessage,
    _messages,
  }: {
    sseMessage: SSEMessage;
    _messages: ChatMessage[];
  }) {
    const { id, textResponse, type, error, streaming } = sseMessage;
    const currentDate = new Date();
    setLoading(false);

    switch (type) {
      case "abort": {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id,
            content: "",
            error: error ?? undefined,
            role: "assistant" as const,
            createdAt: String(currentDate),
            streaming,
            isFormMessage: false,
            form: null,
            formSubmission: null,
            updatedAt: String(currentDate),
            chatId: chatId!,
            clusterId: null,
            seenByUser: false,
            seenByUserAt: null,
            seenByAgent: false,
            flowId: null,
            didNotFulfillQuery: false,
            activity: null,
            formId: null,
            reasoning: "",
          },
        ]);
        break;
      }
      case "textResponseChunk": {
        const chatIdx = _messages.findIndex((chat) => chat.id === id);

        if (chatIdx !== -1) {
          const existingMessage = { ..._messages[chatIdx] };
          const updatedMessage = {
            ...existingMessage,
            content: (existingMessage.content ?? "") + (textResponse ?? ""),
            streaming,
          };
          _messages[chatIdx] = updatedMessage;
        } else {
          _messages.push({
            id,
            content: textResponse ?? "",
            role: "assistant" as const,
            createdAt: String(currentDate),
            streaming,
            isFormMessage: false,
            form: null,
            formSubmission: null,
            updatedAt: String(currentDate),
            chatId: chatId!,
            clusterId: null,
            seenByUser: false,
            seenByUserAt: null,
            seenByAgent: false,
            flowId: null,
            didNotFulfillQuery: false,
            activity: null,
            formId: null,
            reasoning: "",
          });
        }

        setMessages([..._messages]);
        if (!streaming) {
          await generateFollowUps({ messages: _messages });
        }
        break;
      }
      default:
        break;
    }
  }

  async function generateFollowUps({ messages }: { messages: ChatMessage[] }) {
    try {
      const response = await axios.post(`${BASE_URL}/api/generatefollowups`, {
        history: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const { followUps } = response.data;
      return setFollowUps(followUps ?? []);
    } catch (error) {
      // Type guard for axios errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          console.error("Follow-ups generation failed:", error.response.data);
          console.error("Status:", error.response.status);
          console.error("Headers:", error.response.headers);
        } else if (error.request) {
          // Request made but no response received
          console.error("No response received:", error.request);
        } else {
          // Request setup error
          console.error("Error setting up request:", error.message);
        }
        console.error("Error config:", error.config);
      } else {
        // Handle non-axios errors
        console.error("Unexpected error:", error);
      }

      console.log("setting follow ups to empty array- generateFollowUps error");
      return setFollowUps([]);
    }
  }

  // add agent typing and new message events to the socket manager
  const { addMessageToQueue } = useMessageProcessor({
    setMessages,
    setFollowUps,
    messages,
  });

  const handleThread = useCallback(
    (data: { chatId: string; message: any }) => {
      if (chatId === data.chatId) {
        addMessageToQueue(data.message);
      }
    },
    [chatId, setMessages],
  );

  const handleAgentTyping = useCallback(
    (data: any) => {
      if (chatId !== data.chatId) return;

      setMessages((prevThread) => {
        const lastMessage = prevThread[prevThread.length - 1];
        const isTypingMessage =
          lastMessage?.role === "assistant" && lastMessage?.streaming;

        if (isTypingMessage && data.isTyping) {
          setLoading(true);
          return prevThread; // No change needed
        } else if (isTypingMessage && !data.isTyping) {
          setLoading(false);
          return prevThread.slice(0, -1);
        } else if (!isTypingMessage && data.isTyping) {
          setLoading(true);
          const currentDate = new Date();
          return [
            ...prevThread,
            {
              id: `preview-${Date.now()}`,
              role: "assistant" as const,
              createdAt: String(currentDate),
              content: "",
              streaming: true,
              isFormMessage: false,
              form: null,
              formSubmission: null,
              updatedAt: String(currentDate),
              chatId: chatId!,
              clusterId: null,
              seenByUser: false,
              seenByUserAt: null,
              seenByAgent: false,
              flowId: null,
              didNotFulfillQuery: false,
              activity: null,
              formId: null,
              reasoning: "",
            },
          ];
        } else {
          return prevThread;
        }
      });
    },
    [chatId, setMessages, setLoading],
  );

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.on("agent typing", handleAgentTyping);
    socket.on("new message", handleThread);

    return () => {
      socket.off("agent typing", handleAgentTyping);
      socket.off("new message", handleThread);
    };

    // TODO - maybe we need to put thread as a dependency here?
  }, [socket, chatId, handleAgentTyping, handleThread]);

  return (
    <div className="flex flex-col relative h-full">
      <ScrollArea
        ref={scrollRef}
        className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-4"
        onMouseDown={() => inputRef.current?.blur()}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        <div className="space-y-5">
          {msgs.map((message, i) => {
            const isUser = message.role === "user";
            const showActions = i > 0;

            const correspondingQuestion = !isUser
              ? msgs
                  .slice(0, i)
                  .reverse()
                  .find((msg) => msg.role === "user")?.content
              : undefined;

            const messageContent = () => {
              if (loading && !isUser && message.streaming) {
                return <Loading />;
              }
              if (message.isFormMessage) {
                return (
                  <FormMessage
                    BASE_URL={BASE_URL}
                    message={message}
                    setMessages={setMessages}
                  />
                );
              } else {
                return (
                  <Suspense fallback={<Loading />}>
                    <Markdown
                      content={message.content}
                      onDoubleClickCapture={() => {
                        if (!isMobileScreen) return;
                        setUserInput(message.content);
                      }}
                      parentRef={scrollRef}
                      defaultShow={i >= msgs.length - 6}
                    />
                  </Suspense>
                );
              }
            };

            // Regular messages
            // TODO - add UI and logic for saving q&a for incorrect answers
            return (
              <SingleMessageContent
                key={message.id}
                message={message}
                isUser={isUser}
                messageContent={messageContent}
                showActions={showActions}
                toast={toast}
                correspondingQuestion={correspondingQuestion}
              />
            );
          })}

          <div className="space-y-2">
            {followUps.length > 0 ? (
              followUps.map((followUp, i) => (
                <form key={i} onSubmit={handleSubmit}>
                  <Button
                    variant={"outline"}
                    type="submit"
                    className="max-w-[80%] flex items-end text-sm select-text relative break-words rounded-lg px-3 py-2 ml-auto"
                    onClick={() => {
                      setUserInput(followUp);
                    }}
                  >
                    {followUp}
                  </Button>
                </form>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
      </ScrollArea>
      <Separator />
      <div className="relative w-full box-border flex-col pt-2.5 p-5 space-y-2 ">
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          inputRef={inputRef}
          handleSendMessage={handleSubmit}
          scrollToBottom={scrollToBottom}
          setAutoScroll={setAutoScroll}
        />
      </div>
    </div>
  );
}

function userMsg({
  userInput,
  chatId,
}: {
  userInput: string;
  chatId: string;
}): ChatMessage {
  const currentDate = new Date();

  return {
    id: createId(),
    content: userInput,
    role: "user" as const,
    createdAt: String(currentDate),
    streaming: false,
    isFormMessage: false,
    form: null,
    formSubmission: null,
    updatedAt: String(currentDate),
    chatId: chatId!,
    clusterId: null,
    seenByUser: true,
    seenByUserAt: String(currentDate),
    seenByAgent: false,
    flowId: null,
    didNotFulfillQuery: false,
    activity: null,
    formId: null,
    reasoning: "",
  };
}

function initialAssistantMsg({ chatId }: { chatId: string }): ChatMessage {
  const currentDate = new Date();

  return {
    id: createId(),
    content: "",
    role: "assistant" as const,
    createdAt: String(currentDate),
    streaming: true,
    isFormMessage: false,
    form: null,
    formSubmission: null,
    updatedAt: String(currentDate),
    chatId: chatId!,
    clusterId: null,
    seenByUser: false,
    seenByUserAt: null,
    seenByAgent: false,
    flowId: null,
    didNotFulfillQuery: false,
    activity: null,
    formId: null,
    reasoning: "",
  };
}
