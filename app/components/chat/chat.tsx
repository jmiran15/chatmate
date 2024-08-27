import { fetchEventSource } from "@microsoft/fetch-event-source";
import { format } from "date-fns";
import { useEffect, useState } from "react";

import { useLoaderData, useParams, useSearchParams } from "@remix-run/react";
import ChatInput from "./chat-input";

import { createId } from "@paralleldrive/cuid2";
import { Clipboard } from "lucide-react";
import { Suspense, lazy, useMemo, useRef } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useScrollToBottom } from "~/hooks/useScroll";
import { cn } from "~/lib/utils";
import { loader } from "~/routes/chatbots.$chatbotId.chat.$chatId/route";
import { copyToClipboard } from "~/utils/clipboard";
import { useMobileScreen } from "~/utils/mobile";
import { Button } from "../ui/button";
import { Loading } from "../ui/loading";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { ChatAction } from "./chat-action";

// replace this with the new PreviewMarkdown component that uses mdx.js
const Markdown = lazy(() => import("../ui/markdown"));

interface SSEMessage {
  id: string;
  type: "textResponseChunk" | "abort";
  textResponse: string | null;
  error: string | null;
  streaming: boolean;
}

export const CHAT_PAGE_SIZE = 15;

export default function Chat() {
  const data = useLoaderData<typeof loader>();
  const [loading, setLoading] = useState<boolean>(true);

  const [userInput, setUserInput] = useState(() => data?.userMessage ?? "");
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const { chatId, chatbotId } = useParams();
  const [chatbot, setChatbot] = useState(() => data?.chatbot);
  const [BASE_URL, setBASE_URL] = useState(() => data?.BASE_URL);
  const [messages, setMessages] = useState<
    ({ role: "user" | "assistant"; content: string } & {
      id: string;
      createdAt: string;
      streaming: boolean;
    })[]
  >(
    () =>
      data?.messages?.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
        streaming: false,
      })) ?? [],
  );
  const [_, setSearchParams] = useSearchParams();

  const [followUps, setFollowUps] = useState<string[]>([]);
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, messages.length - CHAT_PAGE_SIZE),
  );
  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    setMessages(
      data?.messages?.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
        streaming: false,
      })) ?? [],
    );
    setChatbot(data?.chatbot);
    setBASE_URL(data?.BASE_URL);

    const showInitalStarterQuestions =
      data?.messages?.length <= (data?.chatbot?.introMessages?.length || 0);

    if (showInitalStarterQuestions) {
      setFollowUps(data?.chatbot?.starterQuestions || []);
    } else {
      setFollowUps([]);
    }

    // example queries
    if (data?.userMessage) {
      handleSubmit({ preventDefault: () => {} } as any);
      setSearchParams((prev) => {
        prev.delete("userMessage");
        return prev;
      });
    }
  }, [chatId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userInput || userInput === "") return false;

    const currentDate = new Date();
    // const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    const prevChatHistory = [
      ...messages,
      {
        id: createId(),
        content: userInput,
        role: "user" as "user",
        createdAt: String(currentDate),
        streaming: false,
      },
      {
        id: createId(),
        content: "",
        role: "assistant" as "assistant",
        createdAt: String(currentDate),
        streaming: true,
      },
    ];

    setLoading(true);
    setMessages(prevChatHistory);
    setUserInput("");
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
    const currentDate = new Date();
    // const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    const _messages = [
      ...messages,
      {
        id: createId(),
        content: message,
        role: "user" as "user",
        createdAt: String(currentDate),
        streaming: false,
      },
    ];
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
    _messages: any[];
  }) {
    const { id, textResponse, type, error, streaming } = sseMessage;
    const currentDate = new Date();
    // const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    setLoading(false);

    switch (type) {
      case "abort": {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id,
            content: "",
            error: error ?? undefined,
            role: "assistant" as "assistant",
            createdAt: String(currentDate),
            streaming,
            loading: false,
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
            role: "assistant" as "assistant",
            createdAt: String(currentDate),
            streaming,
            error: undefined,
            loading: false,
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

  async function generateFollowUps({
    messages,
  }: {
    messages: RenderableMessage[];
  }) {
    const followUpRes = await fetch(`${BASE_URL}/api/generatefollowups`, {
      method: "POST",
      body: JSON.stringify({
        history: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    const { followUps } = await followUpRes.json();
    return setFollowUps(followUps);
  }

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

            return (
              <div className="space-y-5" key={i}>
                <div
                  className={
                    isUser
                      ? "flex flex-row-reverse"
                      : "flex flex-row last:animate-[slide-in_ease_0.3s]"
                  }
                >
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <div
                        className={cn(
                          "max-w-[80%] flex flex-col items-start",
                          isUser && "items-end",
                        )}
                      >
                        <div
                          className={cn(
                            "box-border max-w-full text-sm select-text relative break-words rounded-lg px-3 py-2",
                            isUser
                              ? "ml-auto bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <Suspense fallback={<Loading />}>
                            <Markdown
                              content={message.content}
                              loading={
                                // eslint-disable-next-line react/jsx-no-leaked-render
                                loading && !isUser && message.streaming
                              }
                              onDoubleClickCapture={() => {
                                if (!isMobileScreen) return;
                                setUserInput(message.content);
                              }}
                              parentRef={scrollRef}
                              defaultShow={i >= msgs.length - 6}
                            />
                          </Suspense>
                        </div>
                        <div className="text-xs text-muted-foreground opacity-80 whitespace-nowrap text-right w-full box-border pointer-events-none z-[1]">
                          {format(
                            new Date(message.createdAt),
                            "M/d/yyyy, h:mm:ss a",
                          )}
                        </div>
                      </div>
                    </HoverCardTrigger>
                    {showActions ? (
                      <HoverCardContent
                        side="top"
                        align={isUser ? "end" : "start"}
                        className="py-1 px-0 w-fit"
                      >
                        <div className="flex items-center divide-x">
                          <>
                            <ChatAction
                              text={"Copy"}
                              icon={<Clipboard className="w-4 h-4" />}
                              onClick={() =>
                                copyToClipboard(message.content, toast)
                              }
                            />
                          </>
                        </div>
                      </HoverCardContent>
                    ) : (
                      <></>
                    )}
                  </HoverCard>
                </div>
              </div>
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
