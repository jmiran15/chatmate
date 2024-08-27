import { type Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { Check, CheckCheck } from "lucide-react";
import { DateTime } from "luxon";
import { memo, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { PreviewMarkdown } from "~/components/PreviewMarkdown";
import { cn } from "~/lib/utils";
import { useMarkMessageSeen } from "./useMarkMessagesSeen";

const formatMessageDate = (date: Date) => {
  const messageDate = DateTime.fromJSDate(date);
  const now = DateTime.local();
  const diff = now.diff(messageDate, "minutes").minutes;

  if (diff < 1) {
    return "just now";
  } else if (diff < 60) {
    return `${Math.floor(diff)}m ago`;
  } else {
    return messageDate.toFormat("h:mm a");
  }
};

const MessageComponent = memo(
  ({ message }: { message: SerializeFrom<Message> }) => {
    const { markMessageSeen, isMessageSeen } = useMarkMessageSeen(message);
    const isUser = message.role === "user";

    const { ref, inView } = useInView({
      threshold: 0.5,
      triggerOnce: true,
    });

    useEffect(() => {
      console.log("checking if message is seen", message.id, isMessageSeen);
      if (inView && isUser && !isMessageSeen) {
        markMessageSeen();
      }
    }, [inView, isUser, isMessageSeen]);

    const formattedDate = useMemo(
      () => formatMessageDate(new Date(message.createdAt)),
      [message.createdAt],
    );

    return (
      <div
        className={cn(
          "flex flex-col w-full items-start justify-start",
          isUser ? "items-end" : "items-start",
        )}
        ref={isUser ? ref : undefined}
      >
        <div
          className={cn(
            "flex flex-col max-w-[80%] prose prose-zinc border rounded-lg px-3 py-2",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          <div className="flex flex-wrap items-end justify-end">
            <div className="flex-grow min-w-0 mr-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <PreviewMarkdown source={message.content} />
            </div>
            <div className="flex items-center whitespace-nowrap text-[10px] text-muted-foreground opacity-80 translate-y-[0.125em] ml-1 self-end flex-shrink-0">
              <span className="mr-1">{formattedDate}</span>
              {!isUser &&
                (message.seenByUser ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : (
                  <Check className="w-3 h-3 text-muted-foreground" />
                ))}
            </div>
          </div>
        </div>
        {message.id && "id: " + message.id}
        {isUser && (
          <div className="text-xs text-muted-foreground mt-1">
            {isMessageSeen ? "Seen by agent" : "Not seen by agent"}
          </div>
        )}
      </div>
    );
  },
);

MessageComponent.displayName = "MessageComponent";

export default MessageComponent;
