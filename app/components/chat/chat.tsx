import { useFetcher } from "@remix-run/react";
import ChatInput from "./chat-input";
import { Chatbot, Message } from "@prisma/client";

import { ScrollArea } from "../ui/scroll-area";
import { Suspense, lazy, useMemo, useRef, useState } from "react";
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

const Markdown = lazy(() => import("../ui/markdown"));

export const CHAT_PAGE_SIZE = 15;

export default function Chat({
  messages,
  chatbot,
}: {
  messages: Message[];
  chatbot: Chatbot;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const [userInput, setUserInput] = useState("");
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();

  const optimisticMessages = isSubmitting
    ? [
        ...messages,
        {
          role: "user" as "user" | "assistant",
          content: fetcher.formData?.get("message") as string,
          createdAt: new Date().toISOString(),
        },
        {
          role: "assistant",
          content: "Loading...",
          createdAt: new Date().toISOString(),
          last: true, // need to change this to "streaming"
        },
      ]
    : messages;

  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, optimisticMessages.length - CHAT_PAGE_SIZE),
  );

  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(optimisticMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const msgs = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      optimisticMessages.length,
    );
    return optimisticMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, optimisticMessages]);

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
    setMsgRenderIndex(optimisticMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  return (
    <div className="flex flex-col relative h-full">
      <ScrollArea
        ref={scrollRef}
        className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-5"
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
            const showActions = i > 0 && !(message.content.length === 0);

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
                              // eslint-disable-next-line react/jsx-no-leaked-render
                              loading={isSubmitting && !isUser && message.last}
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
        </div>
      </ScrollArea>
      <Separator />
      <div className="relative w-full box-border flex-col pt-2.5 p-5 space-y-2 ">
        <div className="flex justify-between items-center">
          {/* <ChatAction
            text={"Clear"}
            icon={<Eraser className="w-4 h-4" />}
            onClick={() => {}}
            showTitle
            buttonVariant="outline"
          /> */}
        </div>
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          inputRef={inputRef}
          messages={messages.map((m) => ({
            role: m.role,
            content: m.content,
          }))}
          fetcher={fetcher}
          chatbot={chatbot}
          scrollToBottom={scrollToBottom}
          setAutoScroll={setAutoScroll}
        />
      </div>
    </div>
  );
}
