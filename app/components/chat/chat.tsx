import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useLoaderData, useParams } from "@remix-run/react";
import ChatInput from "./chat-input";

import { ScrollArea } from "../ui/scroll-area";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { ChatAction } from "./chat-action";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useToast } from "../ui/use-toast";
import { cn } from "~/lib/utils";
import { copyToClipboard } from "~/utils/clipboard";
import { Separator } from "../ui/separator";
import { Clipboard } from "lucide-react";
import { format } from "date-fns";
import { useScrollToBottom } from "~/hooks/useScroll";
import { useMobileScreen } from "~/utils/mobile";
import { Loading } from "../ui/loading";
import { v4 } from "uuid";
import { Button } from "../ui/button";

const Markdown = lazy(() => import("../ui/markdown"));

export const CHAT_PAGE_SIZE = 15;

export default function Chat() {
  const data = useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInput, setUserInput] = useState("");
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const { chatId, chatbotId } = useParams();
  const [chatbot, setChatbot] = useState(data?.chatbot);
  const [BASE_URL, setBASE_URL] = useState(data?.BASE_URL);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >(data.messages);

  const showInitalStarterQuestions =
    messages.length <= chatbot.introMessages.length;

  const [followUps, setFollowUps] = useState<string[]>(
    showInitalStarterQuestions ? chatbot?.starterQuestions : [],
  );

  useEffect(() => {
    setMessages(data.messages);
    setChatbot(data.chatbot);
    setBASE_URL(data.BASE_URL);
    console.log(
      "show: ",
      data.messages.length <= data.chatbot.introMessages.length,
    );
    setFollowUps(
      data.messages.length <= data.chatbot.introMessages.length
        ? data.chatbot?.starterQuestions
        : [],
    );
  }, [chatId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userInput || userInput === "") return false;

    const prevChatHistory = [
      ...messages,
      { createdAt: new Date().toISOString(), content: userInput, role: "user" },
      {
        createdAt: new Date().toISOString(),
        content: "",
        role: "assistant",
        pending: true,
        userMessage: userInput,
        animate: true,
      },
    ];

    setMessages(prevChatHistory);
    setUserInput("");
    setIsSubmitting(true);
  };

  useEffect(() => {
    // this is where we call our api for a chat response
    async function fetchReply() {
      const promptMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;
      const remHistory = messages.length > 0 ? messages.slice(0, -1) : [];
      const _chatHistory = [...remHistory];

      if (!promptMessage || !promptMessage?.userMessage) {
        setIsSubmitting(false);
        return false;
      }

      if (isSubmitting) setFollowUps([]);

      await streamChat(
        BASE_URL,
        chatbot,
        remHistory,
        chatbotId,
        chatId,
        (chatResult) =>
          handleChat(
            chatResult,
            setIsSubmitting,
            setMessages,
            remHistory,
            _chatHistory,
          ),
      );

      const followUpRes = await fetch(`${BASE_URL}/api/generatefollowups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ history: _chatHistory }),
      });

      const { followUps } = await followUpRes.json();

      setFollowUps(followUps);

      return;
    }

    isSubmitting === true && fetchReply();
  }, [isSubmitting, messages]);

  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, messages.length - CHAT_PAGE_SIZE),
  );

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

  const isMobileScreen = useMobileScreen();

  function scrollToBottom() {
    setMsgRenderIndex(messages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
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
                                isSubmitting && !isUser && message.pending
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

async function streamChat(
  BASE_URL,
  chatbot,
  remHistory,
  chatbotId,
  sessionId,
  handleChat,
) {
  const ctrl = new AbortController();

  if (!BASE_URL) {
    handleChat({
      createdAt: new Date().toISOString(),
      id: v4(),
      type: "abort",
      textResponse: null,
      sources: [],
      close: true,
      error: `An error occurred while streaming response. No messages to send. BASE_URL not found.`,
    });
    ctrl.abort();
    throw new Error();
  }

  const URL_TEST = `${BASE_URL}/api/chat/${chatbotId}/${sessionId}`;
  await fetchEventSource(URL_TEST, {
    method: "POST",
    body: JSON.stringify({
      chatbot,
      messages: remHistory.map((msg) => {
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        };
      }),
    }),
    signal: ctrl.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (response.ok) {
        return; // everything's good
      } else if (response.status >= 400) {
        await response
          .json()
          .then((serverResponse) => {
            handleChat(serverResponse);
          })
          .catch(() => {
            handleChat({
              createdAt: new Date().toISOString(),
              id: v4(),
              type: "abort",
              textResponse: null,
              sources: [],
              close: true,
              error: `An error occurred while streaming response. Code ${response.status}`,
            });
          });
        ctrl.abort();
        throw new Error();
      } else {
        handleChat({
          createdAt: new Date().toISOString(),
          id: v4(),
          type: "abort",
          textResponse: null,
          sources: [],
          close: true,
          error: `An error occurred while streaming response. Unknown Error.`,
        });
        ctrl.abort();
        throw new Error("Unknown Error");
      }
    },
    async onmessage(msg) {
      try {
        const chatResult = JSON.parse(msg.data);
        handleChat(chatResult);

        // eslint-disable-next-line no-empty
      } catch {}
    },
    onerror(err) {
      handleChat({
        createdAt: new Date().toISOString(),
        id: v4(),
        type: "abort",
        textResponse: null,
        sources: [],
        close: true,
        error: `An error occurred while streaming response. ${err.message}`,
      });
      ctrl.abort();
      throw new Error();
    },
  });
}

// For handling of synchronous chats that are not utilizing streaming or chat requests.
function handleChat(
  chatResult,
  setLoadingResponse,
  setChatHistory,
  remHistory,
  _chatHistory,
) {
  const { uuid, textResponse, type, sources = [], error, close } = chatResult;

  if (type === "abort") {
    setLoadingResponse(false);
    setChatHistory([
      ...remHistory,
      {
        createdAt: new Date().toISOString(),
        uuid,
        content: textResponse,
        role: "assistant",
        sources,
        closed: true,
        error,
        animate: false,
        pending: false,
      },
    ]);
    _chatHistory.push({
      createdAt: new Date().toISOString(),
      uuid,
      content: textResponse,
      role: "assistant",
      sources,
      closed: true,
      error,
      animate: false,
      pending: false,
    });
  } else if (type === "textResponse") {
    console.log("got last part? ", textResponse);
    setLoadingResponse(false);
    setChatHistory([
      ...remHistory,
      {
        createdAt: new Date().toISOString(),

        uuid,
        content: textResponse,
        role: "assistant",
        sources,
        closed: close,
        error,
        animate: !close,
        pending: false,
      },
    ]);
    _chatHistory.push({
      createdAt: new Date().toISOString(),

      uuid,
      content: textResponse,
      role: "assistant",
      sources,
      closed: close,
      error,
      animate: !close,
      pending: false,
    });
  } else if (type === "textResponseChunk") {
    const chatIdx = _chatHistory.findIndex((chat) => chat.uuid === uuid);
    if (chatIdx !== -1) {
      const existingHistory = { ..._chatHistory[chatIdx] };
      const updatedHistory = {
        ...existingHistory,
        content: existingHistory.content + textResponse,
        sources,
        error,
        closed: close,
        animate: !close,
        pending: false,
      };
      _chatHistory[chatIdx] = updatedHistory;
    } else {
      _chatHistory.push({
        createdAt: new Date().toISOString(),
        uuid,
        sources,
        error,
        content: textResponse,
        role: "assistant",
        closed: close,
        animate: !close,
        pending: false,
      });
    }
    setChatHistory([..._chatHistory]);
  }
}
