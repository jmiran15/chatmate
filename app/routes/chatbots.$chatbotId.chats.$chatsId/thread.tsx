import { Message } from "@prisma/client";
import { useParams, useFetcher } from "@remix-run/react";
import { format } from "date-fns";
import { Clipboard } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { ChatAction } from "~/components/chat/chat-action";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Loading } from "~/components/ui/loading";
import Markdown from "~/components/ui/markdown";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/components/ui/use-toast";
import { useScrollToBottom } from "~/hooks/useScroll";
import { cn } from "~/lib/utils";
import { useSocket } from "~/providers/socket";
import { copyToClipboard } from "~/utils/clipboard";
import { useInView } from "react-intersection-observer";

export default function Thread({
  // from loader
  thread,
  setThread,
  sessionId,
  seen = false,
}: {
  thread: Message[];
  setThread: (thread: Message[]) => void;
  sessionId: string;
  seen: boolean;
}) {
  const { scrollRef } = useScrollToBottom();
  const { toast } = useToast();
  const socket = useSocket();
  const { chatsId: chatId } = useParams();
  const fetcher = useFetcher({ key: `mark-seen-${chatId}` });

  const findLastUserMessage = () => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === "user") {
        return i;
      }
    }
    return -1;
  };

  const lastUserMessageIndex = findLastUserMessage();

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  useEffect(() => {
    setHasMarkedSeen(false);
  }, [chatId, seen]);

  useEffect(() => {
    if (inView && !seen && lastUserMessageIndex !== -1 && !hasMarkedSeen) {
      fetcher.submit(
        { chatId, intent: "mark-seen" },
        {
          method: "post",
          preventScrollReset: true,
          navigate: false,
        },
      );
      setHasMarkedSeen(true);
      console.log("marking as seen");
    }
  }, [inView, seen, lastUserMessageIndex, fetcher, chatId, hasMarkedSeen]);

  useEffect(() => {
    if (!socket) return;

    const handleThread = (data: { sessionId: string; messages: Message[] }) => {
      console.log("received data: ", data);
      if (sessionId === data.sessionId) {
        console.log(`${sessionId} - messagesChanged: `, data.messages);
        setThread(data.messages);
      }
    };

    socket.on("messages", handleThread);

    return () => {
      socket.off("messages", handleThread);
    };
  }, [socket, sessionId]);

  if (!chatId) {
    return null;
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-5"
    >
      <div className="space-y-5">
        {thread.map((message, i) => {
          const isUser = message.role === "user";
          const showActions = i > 0 && !(message.content.length === 0);
          const isLastUserMessage = i === lastUserMessageIndex;

          return (
            <div className="space-y-5" key={i}>
              <div
                className={
                  isUser
                    ? "flex flex-row-reverse"
                    : "flex flex-row last:animate-[slide-in_ease_0.3s]"
                }
                ref={
                  isLastUserMessage && !seen && !hasMarkedSeen ? ref : undefined
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
                            parentRef={scrollRef}
                            defaultShow={i >= thread.length - 6}
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
  );
}
