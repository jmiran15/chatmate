import { useFetcher } from "@remix-run/react";
import ChatInput from "./chat-input";
import { Chatbot } from "@prisma/client";
import { Markdown } from "../ui/markdown";
import { ScrollArea } from "../ui/scroll-area";
import { useRef } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useToast } from "../ui/use-toast";
import { cn } from "~/lib/utils";
import { ChatAction } from "./chat-action";
import { copyToClipboard } from "~/utils/clipboard";
import { Separator } from "../ui/separator";
import { Clipboard, Eraser } from "lucide-react";

export default function Chat({
  messages,
  chatbot,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  chatbot: Chatbot;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const optimisticMessages = isSubmitting
    ? [
        ...messages,
        {
          role: "user" as "user" | "assistant",
          content: fetcher.formData?.get("message") as string,
        },
        {
          role: "assistant",
          content: "Typing...",
          last: true, // need to change this to "streaming"
        },
      ]
    : messages;

  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col relative h-full">
      <ScrollArea
        className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-5"
        onMouseDown={() => inputRef.current?.blur()}
      >
        <div className="space-y-5">
          {optimisticMessages.map((message, i) => {
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
                          <Markdown
                            content={message.content}
                            loading={isSubmitting && !isUser && message.last !== undefined}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground opacity-80 whitespace-nowrap text-right w-full box-border pointer-events-none z-[1]">
                          {/* {message.date?.toLocaleString()} */}
                          {new Date().toLocaleString()}
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
          <ChatAction
            text={"Clear"}
            icon={<Eraser className="w-4 h-4" />}
            onClick={() => {}}
            showTitle
            buttonVariant="outline"
          />
        </div>
        <ChatInput
          inputRef={inputRef}
          messages={messages}
          fetcher={fetcher}
          chatbot={chatbot}
          scrollToBottom={() => {}}
        />
      </div>
    </div>
  );
}
