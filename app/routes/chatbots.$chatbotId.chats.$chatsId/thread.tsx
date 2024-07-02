import { Message } from "@prisma/client";
import { format } from "date-fns";
import { Clipboard } from "lucide-react";
import { Suspense, useEffect } from "react";
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

export default function Thread({
  // from loader
  thread,
  setThread,
  sessionId,
}: {
  thread: Message[];
  setThread: (thread: Message[]) => void;
  sessionId: string;
}) {
  const { scrollRef } = useScrollToBottom();
  const { toast } = useToast();
  const socket = useSocket();

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

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-5"
    >
      <div className="space-y-5">
        {thread.map((message, i) => {
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
